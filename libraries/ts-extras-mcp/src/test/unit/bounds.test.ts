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
 * Task-support admission and the bounds over a paged tool listing, against a REAL in-memory MCP
 * server: a tool that requires task-augmented execution is skipped (and shown to fail a plain call,
 * which is why), one that only allows it is adapted; a server that pages forever is stopped by
 * `maxPages`, and one that pages slowly by `maxTotalMs`, each as a `'limit-exceeded'` failure and
 * never a truncated catalog.
 */

import '@fgv/ts-utils-jest';
import { getEventListeners } from 'node:events';
import { Logging } from '@fgv/ts-utils';
import { type JsonObject } from '@fgv/ts-json-base';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
  type IAdaptMcpToolsResult,
  type IMcpSession,
  type IMcpToolDescriptor,
  adaptMcpTools,
  callMcpTool,
  closeMcpSession,
  connectMcpSession,
  createCustomTransport,
  listMcpTools
} from '../../packlets/mcp';

const SCHEMA: JsonObject = { type: 'object', properties: { q: { type: 'string' } } };

type ListHandler = (
  cursor: string | undefined,
  signal: AbortSignal
) => Promise<{ tools: ReadonlyArray<Record<string, unknown>>; nextCursor?: string }>;

interface IFixture {
  readonly session: IMcpSession;
  readonly server: Server;
  /** Every `tools/list` request the server received, by cursor. */
  readonly listed: Array<string | undefined>;
  /** Every `tools/list` request whose signal the server saw aborted (the client's cancellation). */
  readonly cancelled: Array<string | undefined>;
}

async function connectTo(list: ListHandler): Promise<IFixture> {
  const listed: Array<string | undefined> = [];
  const cancelled: Array<string | undefined> = [];
  const server = new Server({ name: 'bounds-fixture', version: '0.0.1' }, { capabilities: { tools: {} } });
  server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
    const cursor = request.params?.cursor;
    listed.push(cursor);
    extra.signal.addEventListener('abort', () => cancelled.push(cursor), { once: true });
    return list(cursor, extra.signal);
  });
  server.setRequestHandler(CallToolRequestSchema, async (request) => ({
    content: [{ type: 'text', text: `called ${request.params.name}` }]
  }));
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const session = (await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow() })).orThrow();
  return { session, server, listed, cancelled };
}

/** Resolves after `ms`, or never resolves if `signal` aborts first. */
function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => clearTimeout(timer), { once: true });
  });
}

/** A page of one tool, `t<n>`, that always points at the next one: a server that pages forever. */
function foreverPage(cursor: string | undefined): {
  tools: ReadonlyArray<Record<string, unknown>>;
  nextCursor: string;
} {
  const n = cursor === undefined ? 0 : Number(cursor);
  return { tools: [{ name: `t${n}`, inputSchema: SCHEMA }], nextCursor: String(n + 1) };
}

/** Waits until `predicate` holds, polling briefly; for observations that land on the server side. */
async function eventually(predicate: () => boolean): Promise<void> {
  for (let i = 0; i < 100 && !predicate(); i++) {
    await delay(5);
  }
}

describe('task support', () => {
  let fixture: IFixture;

  beforeEach(async () => {
    fixture = await connectTo(async () => ({
      tools: [
        { name: 'research', inputSchema: SCHEMA, execution: { taskSupport: 'required' } },
        { name: 'maybe', inputSchema: SCHEMA, execution: { taskSupport: 'optional' } },
        { name: 'never', inputSchema: SCHEMA, execution: { taskSupport: 'forbidden' } },
        { name: 'plain', inputSchema: SCHEMA }
      ]
    }));
  });

  afterEach(async () => {
    await closeMcpSession(fixture.session);
    await fixture.server.close();
  });

  test('listMcpTools carries each tool’s task support, and leaves it absent when undeclared', async () => {
    expect(await listMcpTools(fixture.session)).toSucceedAndSatisfy(
      (tools: ReadonlyArray<IMcpToolDescriptor>) => {
        const byName = new Map(tools.map((t) => [t.name, t]));
        expect(byName.get('research')?.execution).toEqual({ taskSupport: 'required' });
        expect(byName.get('maybe')?.execution).toEqual({ taskSupport: 'optional' });
        expect(byName.get('never')?.execution).toEqual({ taskSupport: 'forbidden' });
        expect(byName.get('plain')).not.toHaveProperty('execution');
      }
    );
  });

  test("a required tool fails every plain call — which is why adaptMcpTools skips it", async () => {
    (await listMcpTools(fixture.session)).orThrow();
    expect(await callMcpTool(fixture.session, 'research', {})).toFailWithDetail(/task-based execution/, {
      kind: 'protocol',
      code: -32600
    });
  });

  test("adaptMcpTools skips a 'required' tool with kind 'task-support', and adapts 'optional' and the rest", async () => {
    const logger = new Logging.InMemoryLogger('all');
    expect(await adaptMcpTools(fixture.session, { logger })).toSucceedAndSatisfy(
      (result: IAdaptMcpToolsResult) => {
        expect(result.tools.map((t) => t.config.name)).toEqual(['maybe', 'never', 'plain']);
        expect(result.skipped).toEqual([
          {
            name: 'research',
            kind: 'task-support',
            reason: expect.stringMatching(/taskSupport is 'required'.*cannot drive/),
            schema: SCHEMA
          }
        ]);
      }
    );
    expect(logger.logged.join('\n')).toMatch(
      /skipping tool 'research': it requires task-augmented execution/
    );
  });

  test("an adapted 'optional' tool is called normally", async () => {
    const adapted = (await adaptMcpTools(fixture.session)).orThrow();
    const maybe = adapted.tools.find((t) => t.config.name === 'maybe');
    expect(await maybe!.execute({ q: 'x' })).toSucceedWith('called maybe');
  });
});

describe('task support outside the vocabulary', () => {
  test('is refused by the SDK’s own schema before it reaches this package: the page fails as protocol', async () => {
    const fixture = await connectTo(async () => ({
      tools: [{ name: 'odd', inputSchema: SCHEMA, execution: { taskSupport: 'sometimes' } }]
    }));
    try {
      expect(await listMcpTools(fixture.session)).toFailWithDetail(/listMcpTools/, { kind: 'protocol' });
    } finally {
      await closeMcpSession(fixture.session);
      await fixture.server.close();
    }
  });
});

describe('listing bounds', () => {
  let fixture: IFixture | undefined;

  afterEach(async () => {
    const done = fixture;
    fixture = undefined;
    if (done !== undefined) {
      await closeMcpSession(done.session);
      await done.server.close();
    }
  });

  test('maxPages stops a server that pages forever, after exactly maxPages requests', async () => {
    fixture = await connectTo(async (cursor) => foreverPage(cursor));
    expect(await listMcpTools(fixture.session, { maxPages: 4 })).toFailWithDetail(
      /listMcpTools: the server's tool list continues past maxPages \(4\)/,
      { kind: 'limit-exceeded', limit: 'maxPages' }
    );
    expect(fixture.listed).toEqual([undefined, '1', '2', '3']);
  });

  test('a catalog of exactly maxPages pages succeeds whole', async () => {
    fixture = await connectTo(async (cursor) => {
      const page = foreverPage(cursor);
      return page.nextCursor === '3' ? { tools: page.tools } : page;
    });
    expect(await listMcpTools(fixture.session, { maxPages: 3 })).toSucceedAndSatisfy(
      (tools: ReadonlyArray<IMcpToolDescriptor>) => {
        expect(tools.map((t) => t.name)).toEqual(['t0', 't1', 't2']);
      }
    );
  });

  test('maxTotalMs stops a slow pager, aborting the page in flight', async () => {
    // Two quick pages, then one the server would hold for ten seconds.
    fixture = await connectTo(async (cursor, signal) => {
      await delay(cursor === '2' ? 10000 : 5, signal);
      return foreverPage(cursor);
    });
    const started = Date.now();
    expect(await listMcpTools(fixture.session, { maxTotalMs: 150 })).toFailWithDetail(
      /listMcpTools: the listing did not complete within maxTotalMs \(150 ms\)/,
      { kind: 'limit-exceeded', limit: 'maxTotalMs' }
    );
    expect(Date.now() - started).toBeLessThan(5000);
    expect(fixture.listed).toEqual([undefined, '1', '2']);
    // The server was told to stop the page it was holding.
    const observed = fixture;
    await eventually(() => observed.cancelled.length > 0);
    expect(observed.cancelled).toEqual(['2']);
  });

  test('a listing that finishes inside maxTotalMs succeeds, and leaves no listener on the caller signal', async () => {
    fixture = await connectTo(async (cursor) => {
      const page = foreverPage(cursor);
      return page.nextCursor === '2' ? { tools: page.tools } : page;
    });
    const controller = new AbortController();
    expect(
      await listMcpTools(fixture.session, { maxTotalMs: 5000, signal: controller.signal })
    ).toSucceedAndSatisfy((tools: ReadonlyArray<IMcpToolDescriptor>) => {
      expect(tools).toHaveLength(2);
    });
    expect(getEventListeners(controller.signal, 'abort')).toHaveLength(0);
  });

  test("a caller's abort that lands before the deadline stays 'aborted'", async () => {
    fixture = await connectTo(async (cursor, signal) => {
      await delay(10000, signal);
      return foreverPage(cursor);
    });
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 30);
    expect(
      await listMcpTools(fixture.session, { maxTotalMs: 5000, signal: controller.signal })
    ).toFailWithDetail(/aborted by the caller/, { kind: 'aborted' });
  });

  test("a caller's signal already aborted is 'aborted', with nothing sent", async () => {
    fixture = await connectTo(async (cursor) => foreverPage(cursor));
    const controller = new AbortController();
    controller.abort();
    expect(
      await listMcpTools(fixture.session, { maxTotalMs: 5000, signal: controller.signal })
    ).toFailWithDetail(/aborted before the request was sent/, { kind: 'aborted' });
    expect(fixture.listed).toEqual([]);
  });

  test("each page's own timeoutMs still applies under a longer maxTotalMs", async () => {
    fixture = await connectTo(async (cursor, signal) => {
      await delay(10000, signal);
      return foreverPage(cursor);
    });
    expect(await listMcpTools(fixture.session, { timeoutMs: 50, maxTotalMs: 5000 })).toFailWithDetail(
      /listMcpTools/,
      { kind: 'timeout' }
    );
  });

  test.each([
    ['maxPages', { maxPages: 0 }, /listMcpTools: maxPages must be/],
    ['maxPages', { maxPages: -1 }, /listMcpTools: maxPages must be/],
    ['maxPages', { maxPages: 1.5 }, /listMcpTools: maxPages must be/],
    ['maxPages', { maxPages: Number.NaN }, /listMcpTools: maxPages must be/],
    ['maxPages', { maxPages: Number.POSITIVE_INFINITY }, /listMcpTools: maxPages must be/],
    ['maxTotalMs', { maxTotalMs: 0 }, /listMcpTools: maxTotalMs must be/],
    ['maxTotalMs', { maxTotalMs: Number.NaN }, /listMcpTools: maxTotalMs must be/],
    ['maxTotalMs', { maxTotalMs: 2147483648 }, /listMcpTools: maxTotalMs must be/]
  ])('an invalid %s (%p) fails as invalid-options before anything is sent', async (__name, options, expected) => {
    fixture = await connectTo(async (cursor) => foreverPage(cursor));
    expect(await listMcpTools(fixture.session, options)).toFailWithDetail(expected, {
      kind: 'invalid-options'
    });
    expect(fixture.listed).toEqual([]);
  });

  test('adaptMcpTools forwards its discovery options, so a bound fails the whole adaptation', async () => {
    fixture = await connectTo(async (cursor) => foreverPage(cursor));
    expect(await adaptMcpTools(fixture.session, { discovery: { maxPages: 2 } })).toFailWithDetail(
      /adaptMcpTools: listMcpTools: .*maxPages \(2\)/,
      { kind: 'limit-exceeded', limit: 'maxPages' }
    );
    expect(fixture.listed).toEqual([undefined, '1']);
  });
});
