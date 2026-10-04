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
 * Failure classification and close observation, against a REAL in-memory MCP server (the SDK's
 * `Server` over `InMemoryTransport.createLinkedPair()`, driven through the public
 * `createCustomTransport` seam). Every `McpFailureReason` this suite asserts is produced by the
 * real SDK client raising its real error, not by a mocked one.
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

import {
  type IMcpSession,
  adaptMcpTools,
  callMcpTool,
  closeMcpSession,
  connectMcpSession,
  createCustomTransport,
  listMcpTools
} from '../../packlets/mcp';

const TOOL_ERROR_TEXT = 'the server says: quota exhausted for project 42';

interface IFixture {
  readonly server: Server;
  readonly session: IMcpSession;
  /** Resolves the in-flight `hang` call, if one is pending. */
  readonly release: () => void;
  /** Resolves once the server has entered the `hang` handler — the call is genuinely in flight. */
  readonly entered: Promise<void>;
}

/**
 * Starts a real server and connects a session to it. `hang` blocks until `release()` (or until the
 * server's transport closes), so a test can act while a call is in flight.
 */
async function startFixture(
  onClose?: () => void | Promise<void>,
  logger?: Logging.ILogger
): Promise<IFixture> {
  const server = new Server({ name: 'failures-fixture', version: '0.0.1' }, { capabilities: { tools: {} } });
  let release: () => void = () => undefined;
  let markEntered: () => void = () => undefined;
  const entered = new Promise<void>((resolve) => {
    markEntered = resolve;
  });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{ name: 'echo', inputSchema: { type: 'object', properties: { msg: { type: 'string' } } } }]
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case 'fails':
        return { content: [{ type: 'text', text: TOOL_ERROR_TEXT }], isError: true };
      case 'invalid-params':
        throw new McpError(ErrorCode.InvalidParams, 'bad arguments');
      case 'throws':
        throw new Error('handler blew up');
      case 'server-busy':
        // -32000 is the first of JSON-RPC's implementation-defined server-error codes, and the one
        // the SDK also uses for its own ConnectionClosed.
        throw new McpError(ErrorCode.ConnectionClosed, 'server busy');
      case 'hang':
        await new Promise<void>((resolve) => {
          release = resolve;
          markEntered();
        });
        return { content: [{ type: 'text', text: 'released' }] };
      default:
        return { content: [{ type: 'text', text: `echo: ${JSON.stringify(request.params.arguments)}` }] };
    }
  });

  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await server.connect(serverSide);
  const session = (
    await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow(), onClose, logger })
  ).orThrow();
  return { server, session, release: () => release(), entered };
}

describe('McpFailureReason against a real in-memory MCP server', () => {
  let fixture: IFixture;

  beforeEach(async () => {
    fixture = await startFixture();
  });

  afterEach(async () => {
    fixture.release();
    await closeMcpSession(fixture.session);
    await fixture.server.close();
  });

  test('a successful call carries no failure detail', async () => {
    expect(await callMcpTool(fixture.session, 'echo', { msg: 'hi' })).toSucceedWith({
      content: 'echo: {"msg":"hi"}'
    });
  });

  test("a tool's isError result is tool-error, with the tool's text verbatim and unprefixed", async () => {
    expect(await callMcpTool(fixture.session, 'fails', {})).toFailWithDetail(TOOL_ERROR_TEXT, {
      kind: 'tool-error'
    });
  });

  test('a JSON-RPC error from the server is protocol, carrying its code', async () => {
    expect(await callMcpTool(fixture.session, 'invalid-params', {})).toFailWithDetail(
      // The SDK prefixes the server's message with its code on both ends, hence the repetition.
      /^callMcpTool 'invalid-params': MCP error -32602: MCP error -32602: bad arguments$/,
      { kind: 'protocol', code: ErrorCode.InvalidParams }
    );
  });

  test('a throwing server handler is protocol (the server answers InternalError)', async () => {
    expect(await callMcpTool(fixture.session, 'throws', {})).toFailWithDetail(/handler blew up/, {
      kind: 'protocol',
      code: ErrorCode.InternalError
    });
  });

  test('a server -32000 on an open session is protocol, and the session stays usable', async () => {
    expect(await callMcpTool(fixture.session, 'server-busy', {})).toFailWithDetail(/server busy/, {
      kind: 'protocol',
      code: ErrorCode.ConnectionClosed
    });
    expect(await callMcpTool(fixture.session, 'echo', { msg: 'still here' })).toSucceed();
  });

  test('a call on a closed session is not-connected, not transport', async () => {
    expect(await closeMcpSession(fixture.session)).toSucceedWith(true);
    expect(await callMcpTool(fixture.session, 'echo', { msg: 'late' })).toFailWithDetail(
      /^callMcpTool 'echo': Not connected$/,
      { kind: 'not-connected' }
    );
    expect(await listMcpTools(fixture.session)).toFailWithDetail(/^listMcpTools: Not connected$/, {
      kind: 'not-connected'
    });
    expect(await adaptMcpTools(fixture.session)).toFailWithDetail(/^adaptMcpTools: listMcpTools:/, {
      kind: 'not-connected'
    });
  });

  test('a call in flight when the server goes away is not-connected', async () => {
    const pending = callMcpTool(fixture.session, 'hang', {});
    await fixture.entered;
    await fixture.server.close();
    expect(await pending).toFailWithDetail(/Connection closed/, { kind: 'not-connected' });
  });
});

describe('onClose — observing a session close', () => {
  test('fires once when the server side closes, before any call is made', async () => {
    const onClose = jest.fn();
    const fixture = await startFixture(onClose);
    expect(onClose).not.toHaveBeenCalled();
    await fixture.server.close();
    expect(onClose).toHaveBeenCalledTimes(1);
    // Closing our side afterwards does not report the close a second time.
    expect(await closeMcpSession(fixture.session)).toSucceedWith(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('fires once when the consumer closes the session', async () => {
    const onClose = jest.fn();
    const fixture = await startFixture(onClose);
    expect(await closeMcpSession(fixture.session)).toSucceedWith(true);
    expect(onClose).toHaveBeenCalledTimes(1);
    await fixture.server.close();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('a throwing onClose is contained and logged, and the in-flight call still settles', async () => {
    const logger = new Logging.InMemoryLogger('all');
    const fixture = await startFixture(() => {
      throw new Error('consumer bug');
    }, logger);
    const pending = callMcpTool(fixture.session, 'hang', {});
    await fixture.entered;
    await fixture.server.close();
    // Were the throw to escape into the SDK's close handling, the SDK would never reject the
    // pending request and this await would hang until the test timed out.
    expect(await pending).toFailWithDetail(/Connection closed/, { kind: 'not-connected' });
    expect(logger.logged.join('\n')).toMatch(/onClose callback threw: consumer bug/);
  });

  test('an async onClose that rejects is contained and logged — no unhandled rejection', async () => {
    const logger = new Logging.InMemoryLogger('all');
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const fixture = await startFixture(async () => {
        throw new Error('async consumer bug');
      }, logger);
      const pending = callMcpTool(fixture.session, 'hang', {});
      await fixture.entered;
      await fixture.server.close();
      expect(await pending).toFailWithDetail(/Connection closed/, { kind: 'not-connected' });
      // Let the rejected promise's handler run.
      await new Promise((resolve) => setImmediate(resolve));
      expect(logger.logged.join('\n')).toMatch(/onClose callback rejected: async consumer bug/);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  test('an async onClose that rejects, with no logger, is still contained', async () => {
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    try {
      const fixture = await startFixture(async () => {
        throw new Error('async consumer bug');
      });
      await fixture.server.close();
      await new Promise((resolve) => setImmediate(resolve));
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off('unhandledRejection', unhandled);
    }
  });

  test('a throwing onClose with no logger is still contained', async () => {
    const fixture = await startFixture(() => {
      throw new Error('consumer bug');
    });
    const pending = callMcpTool(fixture.session, 'hang', {});
    await fixture.entered;
    await fixture.server.close();
    expect(await pending).toFailWithDetail(/Connection closed/, { kind: 'not-connected' });
  });
});

describe('a response the SDK rejects', () => {
  test('a malformed tools/call result is protocol, with no code', async () => {
    // A hand-driven peer that completes the handshake, then answers tools/call with content that is
    // not an array — something the SDK's own Server would refuse to send.
    const [clientSide, peer] = InMemoryTransport.createLinkedPair();
    peer.onmessage = (message): void => {
      if (!('id' in message) || !('method' in message)) {
        return;
      }
      const result =
        message.method === 'initialize'
          ? {
              protocolVersion: (message.params as { protocolVersion: string }).protocolVersion,
              capabilities: { tools: {} },
              serverInfo: { name: 'malformed-peer', version: '0.0.1' }
            }
          : { content: 'not an array' };
      peer.send({ jsonrpc: '2.0', id: message.id, result }).catch(() => undefined);
    };
    await peer.start();
    const session = (
      await connectMcpSession({ transport: createCustomTransport(clientSide).orThrow() })
    ).orThrow();

    expect(await callMcpTool(session, 'anything', {})).toFailWithDetail(/^callMcpTool 'anything':/, {
      kind: 'protocol'
    });

    await closeMcpSession(session);
  });
});
