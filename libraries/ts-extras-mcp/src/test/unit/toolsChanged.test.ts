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
 * Descriptor `title` / `outputSchema` and `notifications/tools/list_changed` (personaility#676),
 * against REAL in-process SDK servers over `InMemoryTransport` — the high-level `McpServer`, which
 * sends `tools/list_changed` itself when a tool is registered after connect, and the low-level
 * `Server`, which lets a test hand the client arbitrary descriptors.
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';
import { type JsonValue } from '@fgv/ts-json-base';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
  type IMcpSession,
  type IMcpToolDescriptor,
  closeMcpSession,
  connectMcpSession,
  createCustomTransport,
  listMcpTools
} from '../../packlets/mcp';

/** Lets every queued macrotask (the deferred pre-arm delivery among them) run. */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

/** Connects to a server that lists exactly `tools`, verbatim. */
async function connectListing(
  tools: ReadonlyArray<Record<string, unknown>>,
  logger?: Logging.ILogger
): Promise<IMcpSession> {
  const server = new Server(
    { name: 'descriptor-fixture', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [...tools] } as never));
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  return (
    await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow(), logger })
  ).orThrow();
}

async function listOne(session: IMcpSession): Promise<IMcpToolDescriptor> {
  const listed = (await listMcpTools(session)).orThrow();
  expect(listed).toHaveLength(1);
  return listed[0];
}

const INPUT = { type: 'object', properties: {} };

describe('descriptor title and outputSchema', () => {
  test('a real McpServer tool carries the title it was registered with', async () => {
    const server = new McpServer({ name: 'titled', version: '1.0.0' });
    server.registerTool('weather', { title: 'Current Weather', description: 'weather now' }, async () => ({
      content: [{ type: 'text', text: 'sunny' }]
    }));
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const session = (
      await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow() })
    ).orThrow();
    const tool = await listOne(session);
    expect(tool.name).toBe('weather');
    expect(tool.title).toBe('Current Weather');
    await closeMcpSession(session);
  });

  test('an output schema is carried verbatim, as raw JSON', async () => {
    const outputSchema = {
      type: 'object',
      properties: { temperature: { type: 'number' }, unit: { enum: ['C', 'F'] } },
      required: ['temperature']
    };
    const session = await connectListing([{ name: 'weather', inputSchema: INPUT, outputSchema }]);
    expect((await listOne(session)).outputSchema).toEqual(outputSchema);
    await closeMcpSession(session);
  });

  test('the title falls back to annotations.title, and is absent when there is neither', async () => {
    const session = await connectListing([
      { name: 'a', inputSchema: INPUT, annotations: { title: 'From Annotations' } },
      { name: 'b', title: 'Own Title', inputSchema: INPUT, annotations: { title: 'Not This One' } },
      { name: 'c', inputSchema: INPUT }
    ]);
    const listed = (await listMcpTools(session)).orThrow();
    expect(listed.map((tool) => tool.title)).toEqual(['From Annotations', 'Own Title', undefined]);
    expect('title' in listed[2]).toBe(false);
    expect('outputSchema' in listed[2]).toBe(false);
    await closeMcpSession(session);
  });

  test('an annotations.title that is not one printable line is dropped from the annotations too', async () => {
    const session = await connectListing([
      { name: 'only', inputSchema: INPUT, annotations: { title: 'Two\nlines' } },
      { name: 'mixed', inputSchema: INPUT, annotations: { title: 'Bell\u0007', readOnlyHint: true } }
    ]);
    const listed = (await listMcpTools(session)).orThrow();
    expect(listed[0].title).toBeUndefined();
    expect('annotations' in listed[0]).toBe(false);
    expect(listed[1].title).toBeUndefined();
    expect(listed[1].annotations).toEqual({ readOnlyHint: true });
    await closeMcpSession(session);
  });

  test('a title that is not one printable line is dropped, never altered', async () => {
    const session = await connectListing([
      { name: 'multi', title: 'Line one\nLine two', inputSchema: INPUT, annotations: { title: 'Fallback' } },
      { name: 'bell', title: 'Ring\u0007', inputSchema: INPUT },
      { name: 'nel', title: 'Next\u0085Line', inputSchema: INPUT, annotations: { title: 'Bad\r' } },
      { name: 'empty', title: '', inputSchema: INPUT },
      { name: 'separator', title: 'a\u2028b', inputSchema: INPUT, annotations: { title: 'c\u2029d' } }
    ]);
    const listed = (await listMcpTools(session)).orThrow();
    expect(listed.map((tool) => tool.title)).toEqual([
      'Fallback',
      undefined,
      undefined,
      undefined,
      undefined
    ]);
    await closeMcpSession(session);
  });

  test('an output schema holding a nested own __proto__ key is refused whole, and the refusal logged', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const outputSchema = JSON.parse(
      '{"type":"object","properties":{"x":{"type":"object","properties":{"__proto__":{"type":"string"},"y":{"type":"number"}}}}}'
    ) as JsonValue;
    const session = await connectListing([{ name: 'reserved', inputSchema: INPUT, outputSchema }], logger);
    const tool = await listOne(session);
    expect('outputSchema' in tool).toBe(false);
    expect(logger.logged.join('\n')).toMatch(
      /outputSchema was refused and omitted: holds a reserved "__proto__" key/
    );
    await closeMcpSession(session);
  });

  test('an output schema that is not JSON is omitted, and the refusal does not quote it', async () => {
    const logger = new Logging.InMemoryLogger('detail');
    const outputSchema = {
      type: 'object',
      properties: { when: { default: new Date(0), note: 'secret-ish' } }
    };
    const session = await connectListing([{ name: 'dated', inputSchema: INPUT, outputSchema }], logger);
    const tool = await listOne(session);
    expect('outputSchema' in tool).toBe(false);
    const logged = logger.logged.join('\n');
    expect(logged).toMatch(/outputSchema was refused and omitted: is not JSON/);
    expect(logged).not.toMatch(/secret-ish|dated/);
    await closeMcpSession(session);
  });
});

describe('onToolsChanged', () => {
  async function connectMcpServer(
    onToolsChanged: () => void | Promise<void>,
    logger?: Logging.ILogger
  ): Promise<{ server: McpServer; session: IMcpSession; clientSide: InMemoryTransport }> {
    const server = new McpServer({ name: 'changing', version: '1.0.0' });
    server.registerTool('first', { description: 'the first tool' }, async () => ({
      content: [{ type: 'text', text: 'one' }]
    }));
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const session = (
      await connectMcpSession({
        transport: createCustomTransport(clientSide).orThrow(),
        onToolsChanged,
        logger
      })
    ).orThrow();
    return { server, session, clientSide };
  }

  function addTool(server: McpServer, name: string): void {
    server.registerTool(name, { description: name }, async () => ({
      content: [{ type: 'text', text: name }]
    }));
  }

  test('a tools/list_changed from a real server reaches the callback; the package does not re-list', async () => {
    const holder: { session?: IMcpSession } = {};
    const relisted: string[][] = [];
    const onToolsChanged = jest.fn(async () => {
      relisted.push((await listMcpTools(holder.session!)).orThrow().map((tool) => tool.name));
    });
    const connected = await connectMcpServer(onToolsChanged);
    holder.session = connected.session;
    await settle();
    expect(onToolsChanged).not.toHaveBeenCalled();

    // McpServer sends notifications/tools/list_changed itself when a tool is added after connect.
    addTool(connected.server, 'second');
    await settle();
    expect(onToolsChanged).toHaveBeenCalledTimes(1);
    expect(relisted).toEqual([['first', 'second']]);
    await closeMcpSession(connected.session);
  });

  test('a throwing callback is contained and logged, and later notifications still arrive', async () => {
    const logger = new Logging.InMemoryLogger('all');
    const onToolsChanged = jest.fn(() => {
      throw new Error('consumer bug');
    });
    const { server, session } = await connectMcpServer(onToolsChanged, logger);
    addTool(server, 'second');
    await settle();
    addTool(server, 'third');
    await settle();
    expect(onToolsChanged).toHaveBeenCalledTimes(2);
    expect(logger.logged.join('\n')).toMatch(/onToolsChanged callback threw: consumer bug/);
    expect(await listMcpTools(session)).toSucceed();
    await closeMcpSession(session);
  });

  test('a rejecting async callback is contained: the rejection is caught and logged', async () => {
    // The logged "rejected" line is the proof: it is written by the `.catch` that keeps the
    // rejection from going unhandled. (A process-level unhandledRejection listener is not a reliable
    // witness inside Jest.)
    const logger = new Logging.InMemoryLogger('all');
    const onToolsChanged = jest.fn(async () => {
      throw new Error('async consumer bug');
    });
    const { server, session } = await connectMcpServer(onToolsChanged, logger);
    addTool(server, 'second');
    await settle();
    expect(onToolsChanged).toHaveBeenCalledTimes(1);
    expect(logger.logged.join('\n')).toMatch(/onToolsChanged callback rejected: async consumer bug/);
    await closeMcpSession(session);
  });

  test('a callback that returns a thenable whose then throws is contained', async () => {
    const logger = new Logging.InMemoryLogger('all');
    const hostile = {
      get then(): never {
        throw new Error('then accessor bug');
      }
    };
    const { server, session } = await connectMcpServer(() => hostile as unknown as Promise<void>, logger);
    addTool(server, 'second');
    await settle();
    expect(logger.logged.join('\n')).toMatch(/onToolsChanged callback rejected: then accessor bug/);
    await closeMcpSession(session);
  });

  test('nothing fires after the server closes the connection, for a late delivery', async () => {
    const onToolsChanged = jest.fn();
    const { server, session, clientSide } = await connectMcpServer(onToolsChanged);
    // The close comes from the server's side: closeMcpSession has not been entered.
    await server.close();
    clientSide.onmessage?.({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    await settle();
    expect(onToolsChanged).not.toHaveBeenCalled();
    await closeMcpSession(session);
  });

  test('nothing fires after close, even for a notification the transport delivers late', async () => {
    const onToolsChanged = jest.fn();
    const { session, clientSide } = await connectMcpServer(onToolsChanged);
    expect(await closeMcpSession(session)).toSucceedWith(true);
    // The SDK left its message handler on the transport; a transport that delivers a message after
    // its close (a late in-flight read) still reaches it.
    clientSide.onmessage?.({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    await settle();
    expect(onToolsChanged).not.toHaveBeenCalled();
  });

  test('a notification sent straight after initialize is delivered once, after the session is returned', async () => {
    const server = new Server(
      { name: 'eager', version: '1.0.0' },
      { capabilities: { tools: { listChanged: true } } }
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));
    server.oninitialized = () => {
      server.sendToolListChanged().catch(() => undefined);
    };
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const holder: { session?: IMcpSession } = {};
    const sawSession: Array<boolean> = [];
    const onToolsChanged = jest.fn(() => {
      sawSession.push(holder.session !== undefined);
    });
    holder.session = (
      await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow(), onToolsChanged })
    ).orThrow();
    await settle();
    expect(onToolsChanged).toHaveBeenCalledTimes(1);
    expect(sawSession).toEqual([true]);
    await closeMcpSession(holder.session);
  });

  test('a notification held during the connect is dropped when the session closes first', async () => {
    const server = new Server(
      { name: 'eager', version: '1.0.0' },
      { capabilities: { tools: { listChanged: true } } }
    );
    server.oninitialized = () => {
      server.sendToolListChanged().catch(() => undefined);
    };
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const onToolsChanged = jest.fn();
    const session = (
      await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow(), onToolsChanged })
    ).orThrow();
    // Closed before the deferred delivery runs.
    const closing = closeMcpSession(session);
    expect(await closing).toSucceedWith(true);
    await settle();
    expect(onToolsChanged).not.toHaveBeenCalled();
  });

  test('a session without the callback registers no handler and is unaffected by the notification', async () => {
    const server = new McpServer({ name: 'changing', version: '1.0.0' });
    addTool(server, 'first');
    const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
    await server.connect(serverSide);
    const session = (
      await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow() })
    ).orThrow();
    addTool(server, 'second');
    await settle();
    expect((await listMcpTools(session)).orThrow().map((tool) => tool.name)).toEqual(['first', 'second']);
    await closeMcpSession(session);
  });
});
