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

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));
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
  const session = (await connectMcpSession({ transport: createCustomTransport(clientSide) })).orThrow();
  return {
    server,
    session,
    clientSide,
    entered: entered.promise,
    serverCancelled: serverCancelled.promise,
    callCount: () => calls
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
    const remove = jest.spyOn(controller.signal, 'removeEventListener');
    expect(await callMcpTool(fixture.session, 'progress', {}, { signal: controller.signal })).toSucceed();
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
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
});

describe('connectMcpSession timeout and abort', () => {
  /** A client transport whose peer never answers: the initialize request is never responded to. */
  function silentPeer(): { clientSide: InMemoryTransport; serverSide: InMemoryTransport } {
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    return { clientSide, serverSide };
  }

  test('timeoutMs bounds the handshake and fails timeout', async () => {
    const { clientSide, serverSide } = silentPeer();
    expect(
      await connectMcpSession({ transport: createCustomTransport(clientSide), timeoutMs: 50 })
    ).toFailWithDetail(/^connectMcpSession: .*Request timed out/, { kind: 'timeout' });
    await serverSide.close();
  });

  test('an abort during the handshake fails aborted', async () => {
    const { clientSide, serverSide } = silentPeer();
    const controller = new AbortController();
    const pending = connectMcpSession({
      transport: createCustomTransport(clientSide),
      signal: controller.signal
    });
    setTimeout(() => controller.abort(), 20);
    expect(await pending).toFailWithDetail('connectMcpSession: aborted by the caller', { kind: 'aborted' });
    await serverSide.close();
  });

  test('a signal already aborted fails aborted without starting the handshake', async () => {
    const { clientSide } = silentPeer();
    const start = jest.spyOn(clientSide, 'start');
    const controller = new AbortController();
    controller.abort();
    expect(
      await connectMcpSession({ transport: createCustomTransport(clientSide), signal: controller.signal })
    ).toFailWithDetail('connectMcpSession: aborted before the request was sent', { kind: 'aborted' });
    expect(start).not.toHaveBeenCalled();
  });
});
