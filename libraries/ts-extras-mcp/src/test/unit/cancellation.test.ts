/*
 * Copyright (c) 2026 Erik Fortune
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Per-request timeout, abort and progress, against a REAL in-memory MCP server. These are the
 * load-bearing proofs for the options bag: an aborted call stops promptly and the *server* sees
 * the cancellation; a timed-out call is `timeout`; an abort is `aborted`; neither is `transport`;
 * and the outcome is whichever the SDK settled with first, even when the other lands a microtask
 * later.
 */

import '@fgv/ts-utils-jest';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
  type IMcpProgress,
  type IMcpSession,
  callMcpTool,
  closeMcpSession,
  connectMcpSession,
  createCustomTransport,
  listMcpTools
} from '../../packlets/mcp';

interface IFixture {
  readonly server: Server;
  readonly session: IMcpSession;
  readonly clientSide: InMemoryTransport;
  /** Resolves when the server enters the `hang` handler. */
  readonly entered: Promise<void>;
  /** Resolves with the server-side abort reason when the server sees `hang` cancelled. */
  readonly serverCancelled: Promise<unknown>;
  /** How many times the server's `tools/call` handler ran. */
  readonly callCount: () => number;
  /** How many `tools/list` pages the server served. */
  readonly listCount: () => number;
  /**
   * How `tools/list` behaves: one empty page; two pages, calling `onFirstPage` while serving the
   * first; or never answering.
   */
  setListBehavior(behavior: 'single' | 'paged' | 'hang', onFirstPage?: () => void): void;
}

function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void } {
  let settle: (value: T) => void = () => undefined;
  const promise = new Promise<T>((resolve) => {
    settle = resolve;
  });
  return { promise, resolve: settle };
}

async function startFixture(): Promise<IFixture> {
  const server = new Server({ name: 'cancel-fixture', version: '0.0.1' }, { capabilities: { tools: {} } });
  const entered = deferred<void>();
  const serverCancelled = deferred<unknown>();
  let calls = 0;
  let lists = 0;
  let listBehavior: 'single' | 'paged' | 'hang' = 'single';
  let onFirstPage: (() => void) | undefined;

  server.setRequestHandler(ListToolsRequestSchema, async (request) => {
    lists++;
    if (listBehavior === 'hang') {
      await new Promise(() => undefined);
    }
    if (listBehavior === 'paged' && request.params?.cursor === undefined) {
      onFirstPage?.();
      return { tools: [], nextCursor: 'page-2' };
    }
    return { tools: [] };
  });
  server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
    calls++;
    if (request.params.name === 'progress') {
      // Five progress notifications, 30 ms apart: 150 ms of work that keeps reporting.
      const token = request.params._meta?.progressToken;
      for (let step = 1; step <= 5; step++) {
        await new Promise((resolve) => setTimeout(resolve, 30));
        if (token !== undefined) {
          // The first notification carries neither total nor message: both are optional.
          const detail = step === 1 ? {} : { total: 5, message: `step ${step}` };
          await extra.sendNotification({
            method: 'notifications/progress',
            params: { progressToken: token, progress: step, ...detail }
          });
        }
      }
      return { content: [{ type: 'text', text: 'finished' }] };
    }
    // `hang`: runs until the client cancels it.
    entered.resolve();
    await new Promise<void>((resolve) => {
      extra.signal.addEventListener('abort', () => {
        serverCancelled.resolve(extra.signal.reason);
        resolve();
      });
    });
    return { content: [{ type: 'text', text: 'cancelled' }] };
  });

  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const session = (
    await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow() })
  ).orThrow();
  return {
    server,
    session,
    clientSide,
    entered: entered.promise,
    serverCancelled: serverCancelled.promise,
    callCount: () => calls,
    listCount: () => lists,
    setListBehavior: (behavior, firstPage) => {
      listBehavior = behavior;
      onFirstPage = firstPage;
    }
  };
}

describe('per-request options against a real in-memory MCP server', () => {
  let fixture: IFixture;

  beforeEach(async () => {
    fixture = await startFixture();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await closeMcpSession(fixture.session);
    await fixture.server.close();
  });

  test('aborting an in-flight call returns aborted promptly, and the server sees the cancellation', async () => {
    const controller = new AbortController();
    const started = Date.now();
    // A generous timeout: were the abort not reaching the SDK, the call would run on to it.
    const pending = callMcpTool(
      fixture.session,
      'hang',
      {},
      { signal: controller.signal, timeoutMs: 30_000 }
    );
    await fixture.entered;
    controller.abort();

    expect(await pending).toFailWithDetail("callMcpTool 'hang': aborted by the caller", { kind: 'aborted' });
    expect(Date.now() - started).toBeLessThan(5_000);
    // The server's handler was told to stop — the request did not run on as an orphan.
    expect(String(await fixture.serverCancelled)).toMatch(/request aborted by the caller/);
  });

  test('a signal already aborted fails aborted without sending anything', async () => {
    const controller = new AbortController();
    controller.abort();
    expect(await callMcpTool(fixture.session, 'hang', {}, { signal: controller.signal })).toFailWithDetail(
      "callMcpTool 'hang': aborted before the request was sent",
      { kind: 'aborted' }
    );
    expect(await listMcpTools(fixture.session, { signal: controller.signal })).toFailWithDetail(
      'listMcpTools: aborted before the request was sent',
      { kind: 'aborted' }
    );
    expect(fixture.callCount()).toBe(0);
  });

  test('timeoutMs fails timeout — not transport, not aborted — and the server sees the cancellation', async () => {
    expect(await callMcpTool(fixture.session, 'hang', {}, { timeoutMs: 50 })).toFailWithDetail(
      /^callMcpTool 'hang': MCP error -32001: Request timed out$/,
      { kind: 'timeout' }
    );
    expect(String(await fixture.serverCancelled)).toMatch(/Request timed out/);
  });

  test('a timeout with a signal that never fires is still timeout', async () => {
    const controller = new AbortController();
    expect(
      await callMcpTool(fixture.session, 'hang', {}, { timeoutMs: 50, signal: controller.signal })
    ).toFailWithDetail(/Request timed out/, { kind: 'timeout' });
  });

  test('an abort that lands after the timeout has settled the request is still timeout', async () => {
    const controller = new AbortController();
    const send = fixture.clientSide.send.bind(fixture.clientSide);
    // When the SDK's timeout fires it sends `notifications/cancelled`, then synchronously rejects
    // the request. Abort on the next microtask: after the SDK has settled with the timeout, but
    // before callMcpTool's continuation has run. By then `signal.aborted` is true, so a classifier
    // that re-read it after the await would wrongly report `aborted`.
    jest.spyOn(fixture.clientSide, 'send').mockImplementation(async (message, options) => {
      if ('method' in message && message.method === 'notifications/cancelled') {
        queueMicrotask(() => controller.abort());
      }
      return send(message, options);
    });

    const result = await callMcpTool(
      fixture.session,
      'hang',
      {},
      { timeoutMs: 50, signal: controller.signal }
    );
    expect(controller.signal.aborted).toBe(true);
    expect(result).toFailWithDetail(/Request timed out/, { kind: 'timeout' });
  });

  test('the listener on the caller signal is removed once the call settles', async () => {
    const controller = new AbortController();
    const add = jest.spyOn(controller.signal, 'addEventListener');
    const remove = jest.spyOn(controller.signal, 'removeEventListener');
    expect(await callMcpTool(fixture.session, 'progress', {}, { signal: controller.signal })).toSucceed();
    expect(add).toHaveBeenCalledTimes(1);
    // The very listener that was added is the one removed.
    expect(remove).toHaveBeenCalledWith('abort', add.mock.calls[0][1]);
    // Aborting afterwards affects nothing.
    controller.abort();
    expect(await callMcpTool(fixture.session, 'progress', {})).toSucceedWith({ content: 'finished' });
  });

  test('onProgress receives the server progress notifications, mapped', async () => {
    const seen: IMcpProgress[] = [];
    expect(
      await callMcpTool(fixture.session, 'progress', {}, { onProgress: (p) => seen.push(p) })
    ).toSucceedWith({ content: 'finished' });
    expect(seen).toEqual([
      { progress: 1 },
      ...[2, 3, 4, 5].map((step) => ({ progress: step, total: 5, message: `step ${step}` }))
    ]);
  });

  test('without resetTimeoutOnProgress, a call that outlives timeoutMs times out despite progress', async () => {
    expect(
      await callMcpTool(fixture.session, 'progress', {}, { timeoutMs: 80, onProgress: () => undefined })
    ).toFailWithDetail(/Request timed out/, { kind: 'timeout' });
  });

  test('resetTimeoutOnProgress lets a reporting call outlive timeoutMs', async () => {
    expect(
      await callMcpTool(
        fixture.session,
        'progress',
        {},
        { timeoutMs: 80, resetTimeoutOnProgress: true, onProgress: () => undefined }
      )
    ).toSucceedWith({ content: 'finished' });
  });

  test('maxTotalTimeoutMs caps a call that progress would otherwise extend', async () => {
    expect(
      await callMcpTool(
        fixture.session,
        'progress',
        {},
        { timeoutMs: 80, resetTimeoutOnProgress: true, maxTotalTimeoutMs: 70, onProgress: () => undefined }
      )
    ).toFailWithDetail(/Maximum total timeout exceeded/, { kind: 'timeout' });
  });

  test('listMcpTools accepts the same options', async () => {
    expect(await listMcpTools(fixture.session, { timeoutMs: 5_000 })).toSucceedWith([]);
  });

  test('an out-of-range timeout fails invalid-options before anything is sent', async () => {
    for (const timeoutMs of [Infinity, 0, -5, Number.NaN, 2 ** 31]) {
      expect(await callMcpTool(fixture.session, 'hang', {}, { timeoutMs })).toFailWithDetail(
        /^callMcpTool 'hang': timeoutMs must be a positive number/,
        { kind: 'invalid-options' }
      );
    }
    expect(
      await callMcpTool(
        fixture.session,
        'hang',
        {},
        { maxTotalTimeoutMs: Infinity, resetTimeoutOnProgress: true }
      )
    ).toFailWithDetail(/maxTotalTimeoutMs must be a positive number/, { kind: 'invalid-options' });
    expect(await listMcpTools(fixture.session, { timeoutMs: Infinity })).toFailWithDetail(
      /^listMcpTools: timeoutMs must be/,
      { kind: 'invalid-options' }
    );
    expect(fixture.callCount()).toBe(0);
    expect(fixture.listCount()).toBe(0);
  });

  test('the largest timeout setTimeout honours is accepted', async () => {
    expect(await callMcpTool(fixture.session, 'progress', {}, { timeoutMs: 2 ** 31 - 1 })).toSucceedWith({
      content: 'finished'
    });
  });

  test('listMcpTools honours timeoutMs', async () => {
    fixture.setListBehavior('hang');
    expect(await listMcpTools(fixture.session, { timeoutMs: 50 })).toFailWithDetail(/Request timed out/, {
      kind: 'timeout'
    });
  });

  test('an abort during pagination fails aborted and requests no further page', async () => {
    const controller = new AbortController();
    // Aborts while the server is serving the first of two pages.
    fixture.setListBehavior('paged', () => controller.abort());
    expect(await listMcpTools(fixture.session, { signal: controller.signal })).toFailWithDetail(
      'listMcpTools: aborted by the caller',
      { kind: 'aborted' }
    );
    expect(fixture.listCount()).toBe(1);
  });
});

describe('createCustomTransport', () => {
  test('refuses a transport that already carries a session id — the SDK would skip the handshake', () => {
    const [clientSide] = InMemoryTransport.createLinkedPair();
    clientSide.sessionId = 'stale-session';
    expect(createCustomTransport(clientSide)).toFailWith(/already has a session id/);
    // The id acts like a routing token and failure messages reach logs: it is not echoed.
    expect(createCustomTransport(clientSide)).not.toFailWith(/stale-session/);
  });

  test('a custom handle is single-use against a real server: the second connect never starts it again', async () => {
    const server = new Server({ name: 'single-use', version: '0.0.1' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const start = jest.spyOn(clientSide, 'start');
    const transport = createCustomTransport(clientSide).orThrow();
    const session = (await connectMcpSession({ transport })).orThrow();
    expect(await connectMcpSession({ transport })).toFailWithDetail(/already used by a connect/, {
      kind: 'invalid-handle'
    });
    expect(start).toHaveBeenCalledTimes(1);
    // The first session is unaffected.
    expect(await listMcpTools(session)).toSucceed();
    await closeMcpSession(session);
    await server.close();
  });
});

describe('connectMcpSession timeout and abort', () => {
  /** A client transport whose peer never answers: the initialize request is never responded to. */
  function silentPeer(): { clientSide: InMemoryTransport; serverSide: InMemoryTransport } {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    return { clientSide, serverSide };
  }

  test('timeoutMs bounds the handshake and fails timeout', async () => {
    const { clientSide, serverSide } = silentPeer();
    const onClose = jest.fn();
    expect(
      await connectMcpSession({
        transport: createCustomTransport(clientSide).orThrow(),
        timeoutMs: 50,
        onClose
      })
    ).toFailWithDetail(/^connectMcpSession: .*Request timed out/, { kind: 'timeout' });
    await serverSide.close();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('an abort during the handshake fails aborted', async () => {
    const { clientSide, serverSide } = silentPeer();
    const controller = new AbortController();
    const onClose = jest.fn();
    const pending = connectMcpSession({
      transport: createCustomTransport(clientSide).orThrow(),
      signal: controller.signal,
      onClose
    });
    setTimeout(() => controller.abort(), 20);
    expect(await pending).toFailWithDetail('connectMcpSession: aborted by the caller', { kind: 'aborted' });
    await serverSide.close();
    // The SDK closed the transport on the failed handshake; a session that was never handed out
    // never reports a close.
    expect(onClose).not.toHaveBeenCalled();
  });

  test('a signal already aborted fails aborted without starting the handshake', async () => {
    const { clientSide } = silentPeer();
    const start = jest.spyOn(clientSide, 'start');
    const controller = new AbortController();
    controller.abort();
    expect(
      await connectMcpSession({
        transport: createCustomTransport(clientSide).orThrow(),
        signal: controller.signal
      })
    ).toFailWithDetail('connectMcpSession: aborted before the request was sent', { kind: 'aborted' });
    expect(start).not.toHaveBeenCalled();
  });
});

/**
 * A custom transport whose `start()` and `close()` are scripted, and whose peer never answers.
 * Its `close()` calls the SDK-assigned `onclose`, as `IMcpSdkTransport` requires.
 */
class ScriptedTransport {
  public onclose?: () => void;
  public onerror?: (error: Error) => void;
  public onmessage?: (message: unknown) => void;
  /** Set once `start()` has acquired its (pretend) resource. */
  public allocated: boolean = false;
  public readonly closeCalls: jest.Mock = jest.fn();
  private readonly _start: 'reject' | 'stall' | 'ok';
  private readonly _close: 'ok' | 'never';

  public constructor(start: 'reject' | 'stall' | 'ok', close: 'ok' | 'never') {
    this._start = start;
    this._close = close;
  }

  public async start(): Promise<void> {
    this.allocated = true;
    if (this._start === 'reject') {
      throw new Error('listen EADDRINUSE');
    }
    if (this._start === 'stall') {
      await new Promise<void>(() => undefined);
    }
  }

  public async send(): Promise<void> {
    // The peer never answers.
  }

  public async close(): Promise<void> {
    this.closeCalls();
    if (this._close === 'never') {
      return new Promise<void>(() => undefined);
    }
    this.onclose?.();
  }
}

describe('connectMcpSession teardown on a lost or failed connect (custom transports)', () => {
  test('a transport whose start() rejects is closed — the SDK itself never closes it', async () => {
    const scripted = new ScriptedTransport('reject', 'ok');
    const onClose = jest.fn();
    expect(
      await connectMcpSession({ transport: createCustomTransport(scripted).orThrow(), onClose })
    ).toFailWithDetail(/^connectMcpSession: listen EADDRINUSE$/, { kind: 'transport' });
    expect(scripted.allocated).toBe(true);
    expect(scripted.closeCalls).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('a close() that never resolves does not stretch the connect past timeoutMs', async () => {
    const scripted = new ScriptedTransport('ok', 'never');
    const started = Date.now();
    expect(
      await connectMcpSession({ transport: createCustomTransport(scripted).orThrow(), timeoutMs: 100 })
    ).toFailWithDetail(/Request timed out/, { kind: 'timeout' });
    expect(Date.now() - started).toBeLessThan(2_000);
    // Started, not awaited. (It may be reached twice: when the SDK's own handshake failure also
    // closes, a close() that never calls onclose leaves the SDK still holding the transport.)
    expect(scripted.closeCalls).toHaveBeenCalled();
  });

  test('a close() that never resolves does not delay an aborted connect either', async () => {
    const scripted = new ScriptedTransport('ok', 'never');
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);
    const started = Date.now();
    expect(
      await connectMcpSession({
        transport: createCustomTransport(scripted).orThrow(),
        timeoutMs: 30_000,
        signal: controller.signal
      })
    ).toFailWithDetail('connectMcpSession: aborted by the caller', { kind: 'aborted' });
    expect(Date.now() - started).toBeLessThan(2_000);
    // Started, not awaited. (It may be reached twice: when the SDK's own handshake failure also
    // closes, a close() that never calls onclose leaves the SDK still holding the transport.)
    expect(scripted.closeCalls).toHaveBeenCalled();
  });

  test('an abort during a start() that genuinely stalls settles aborted and closes the transport', async () => {
    const scripted = new ScriptedTransport('stall', 'ok');
    const onClose = jest.fn();
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 50);
    const started = Date.now();
    expect(
      await connectMcpSession({
        transport: createCustomTransport(scripted).orThrow(),
        timeoutMs: 30_000,
        signal: controller.signal,
        onClose
      })
    ).toFailWithDetail('connectMcpSession: aborted by the caller', { kind: 'aborted' });
    expect(Date.now() - started).toBeLessThan(2_000);
    expect(scripted.closeCalls).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });
});
