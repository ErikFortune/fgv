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

// Mock the SDK-isolation seam so no live MCP server / subprocess is required. The factories
// return controllable fakes; `makeClient` is configured per-test. The jest.mock call must
// precede the regular imports (hoist-jest-mock).
jest.mock('../../packlets/mcp/sdk', () => ({
  makeClient: jest.fn(),
  makeStdioTransport: jest.fn(() => ({ sentinel: 'stdio' })),
  makeHttpTransport: jest.fn(() => ({ sentinel: 'http' }))
}));

import '@fgv/ts-utils-jest';
import { Logging, type Result } from '@fgv/ts-utils';
import { type JsonObject, type JsonValue } from '@fgv/ts-json-base';

// eslint-disable-next-line @rushstack/packlets/mechanics
import * as sdk from '../../packlets/mcp/sdk';
import {
  type IAdaptMcpToolsResult,
  type IMcpSession,
  type IMcpToolDescriptor,
  type IMcpTransport,
  adaptMcpTools,
  callMcpTool,
  closeMcpSession,
  connectMcpSession,
  createHttpTransport,
  createStdioTransport,
  listMcpTools
} from '../../packlets/mcp';

const mockSdk = sdk as jest.Mocked<typeof sdk>;

interface IFakeClient {
  connect: jest.Mock;
  getServerVersion: jest.Mock;
  listTools: jest.Mock;
  callTool: jest.Mock;
  close: jest.Mock;
}

function makeFakeClient(overrides: Partial<IFakeClient> = {}): IFakeClient {
  return {
    connect: jest.fn(async () => undefined),
    getServerVersion: jest.fn(() => ({ name: 'fake-server', version: '1.2.3' })),
    listTools: jest.fn(async () => ({ tools: [] })),
    callTool: jest.fn(async () => ({ content: [] })),
    close: jest.fn(async () => undefined),
    ...overrides
  };
}

/** Connect a session backed by the given fake client (and a stdio transport). */
async function connectWith(fake: IFakeClient): Promise<IMcpSession> {
  mockSdk.makeClient.mockReturnValueOnce(fake as unknown as sdk.ISdkClient);
  const transport = createStdioTransport({ command: 'node' }).orThrow();
  return (await connectMcpSession({ transport })).orThrow();
}

/** A foreign (non-package) handle, to exercise the loud narrowing-failure paths. */
const FOREIGN_TRANSPORT = { transportKind: 'stdio' } as unknown as IMcpTransport;
const FOREIGN_SESSION = {
  clientName: 'x',
  clientVersion: 'y',
  serverInfo: undefined
} as unknown as IMcpSession;

beforeEach(() => {
  jest.clearAllMocks();
  mockSdk.makeStdioTransport.mockReturnValue({ sentinel: 'stdio' } as unknown as sdk.ISdkTransport);
  mockSdk.makeHttpTransport.mockReturnValue({ sentinel: 'http' } as unknown as sdk.ISdkTransport);
});

// ===========================================================================
// Transports
// ===========================================================================

describe('createStdioTransport', () => {
  test('succeeds for a valid command', () => {
    expect(createStdioTransport({ command: 'node', args: ['x'] })).toSucceedAndSatisfy((t: IMcpTransport) => {
      expect(t.transportKind).toBe('stdio');
    });
    expect(mockSdk.makeStdioTransport).toHaveBeenCalledWith(
      expect.objectContaining({ command: 'node', args: ['x'] })
    );
  });

  test('fails for an empty/whitespace command', () => {
    expect(createStdioTransport({ command: '' })).toFailWith(/command must be a non-empty string/);
    expect(createStdioTransport({ command: '   ' })).toFailWith(/command must be a non-empty string/);
  });

  test('fails (Result) when the SDK constructor throws', () => {
    mockSdk.makeStdioTransport.mockImplementationOnce(() => {
      throw new Error('spawn boom');
    });
    expect(createStdioTransport({ command: 'node' })).toFailWith(/createStdioTransport:.*spawn boom/);
  });
});

describe('createHttpTransport', () => {
  test('succeeds for http and https urls and forwards headers', () => {
    expect(createHttpTransport({ url: 'http://localhost:9000/mcp' })).toSucceedAndSatisfy(
      (t: IMcpTransport) => {
        expect(t.transportKind).toBe('http');
      }
    );
    expect(
      createHttpTransport({ url: 'https://example.com/mcp', headers: { authorization: 'Bearer t' } })
    ).toSucceed();
    expect(mockSdk.makeHttpTransport).toHaveBeenCalledWith(expect.any(URL), { authorization: 'Bearer t' });
  });

  test('fails for an unparseable url', () => {
    expect(createHttpTransport({ url: 'not a url' })).toFailWith(/invalid url 'not a url'/);
  });

  test('fails for a non-http(s) protocol', () => {
    expect(createHttpTransport({ url: 'ftp://example.com' })).toFailWith(/must use http or https/);
  });

  test('fails (Result) when the SDK constructor throws', () => {
    mockSdk.makeHttpTransport.mockImplementationOnce(() => {
      throw new Error('http boom');
    });
    expect(createHttpTransport({ url: 'http://localhost' })).toFailWith(/createHttpTransport:.*http boom/);
  });
});

// ===========================================================================
// Session lifecycle
// ===========================================================================

describe('connectMcpSession', () => {
  test('fails loudly for a foreign transport handle', async () => {
    expect(await connectMcpSession({ transport: FOREIGN_TRANSPORT })).toFailWith(/invalid MCP transport/);
  });

  test('connects and reports server identity, logging when a logger is supplied', async () => {
    const logger = new Logging.InMemoryLogger('all');
    const fake = makeFakeClient();
    mockSdk.makeClient.mockReturnValueOnce(fake as unknown as sdk.ISdkClient);
    const transport = createStdioTransport({ command: 'node' }).orThrow();

    expect(
      await connectMcpSession({ transport, clientName: 'me', clientVersion: '0.0.1', logger })
    ).toSucceedAndSatisfy((session: IMcpSession) => {
      expect(session.clientName).toBe('me');
      expect(session.clientVersion).toBe('0.0.1');
      expect(session.serverInfo).toEqual({ name: 'fake-server', version: '1.2.3' });
    });
    expect(mockSdk.makeClient).toHaveBeenCalledWith('me', '0.0.1');
    expect(fake.connect).toHaveBeenCalledTimes(1);
    expect(logger.logged.join('\n')).toMatch(/connected to server fake-server@1.2.3/);
  });

  test('connects with default identity and no server info, no logger', async () => {
    const fake = makeFakeClient({ getServerVersion: jest.fn(() => undefined) });
    mockSdk.makeClient.mockReturnValueOnce(fake as unknown as sdk.ISdkClient);
    const transport = createStdioTransport({ command: 'node' }).orThrow();

    expect(await connectMcpSession({ transport })).toSucceedAndSatisfy((session: IMcpSession) => {
      expect(session.clientName).toBe('@fgv/ts-extras-mcp');
      expect(session.serverInfo).toBeUndefined();
    });
  });

  test('logs the no-identity case when a logger is supplied', async () => {
    const logger = new Logging.InMemoryLogger('all');
    const fake = makeFakeClient({ getServerVersion: jest.fn(() => undefined) });
    mockSdk.makeClient.mockReturnValueOnce(fake as unknown as sdk.ISdkClient);
    const transport = createStdioTransport({ command: 'node' }).orThrow();

    expect(await connectMcpSession({ transport, logger })).toSucceed();
    expect(logger.logged.join('\n')).toMatch(/connected \(server did not report identity\)/);
  });

  test('fails when the connect handshake throws', async () => {
    const fake = makeFakeClient({
      connect: jest.fn(async () => {
        throw new Error('handshake refused');
      })
    });
    mockSdk.makeClient.mockReturnValueOnce(fake as unknown as sdk.ISdkClient);
    const transport = createStdioTransport({ command: 'node' }).orThrow();

    expect(await connectMcpSession({ transport })).toFailWith(/connectMcpSession:.*handshake refused/);
  });
});

describe('closeMcpSession', () => {
  test('fails loudly for a foreign session handle', async () => {
    expect(await closeMcpSession(FOREIGN_SESSION)).toFailWith(/invalid MCP session/);
  });

  test('closes a connected session', async () => {
    const fake = makeFakeClient();
    const session = await connectWith(fake);
    expect(await closeMcpSession(session)).toSucceedWith(true);
    expect(fake.close).toHaveBeenCalledTimes(1);
  });

  test('fails when close throws', async () => {
    const fake = makeFakeClient({
      close: jest.fn(async () => {
        throw new Error('already closed');
      })
    });
    const session = await connectWith(fake);
    expect(await closeMcpSession(session)).toFailWith(/closeMcpSession:.*already closed/);
  });
});

// ===========================================================================
// Tool discovery + invocation
// ===========================================================================

describe('listMcpTools', () => {
  test('fails loudly for a foreign session handle', async () => {
    expect(await listMcpTools(FOREIGN_SESSION)).toFailWith(/invalid MCP session/);
  });

  test('returns a single-page catalog', async () => {
    const fake = makeFakeClient({
      listTools: jest.fn(async () => ({
        tools: [{ name: 'a', description: 'tool a', inputSchema: { type: 'object' } }]
      }))
    });
    const session = await connectWith(fake);
    expect(await listMcpTools(session)).toSucceedAndSatisfy((tools: ReadonlyArray<IMcpToolDescriptor>) => {
      expect(tools).toHaveLength(1);
      expect(tools[0]).toEqual({ name: 'a', description: 'tool a', inputSchema: { type: 'object' } });
    });
  });

  test('follows nextCursor across pages', async () => {
    const listTools = jest
      .fn()
      .mockResolvedValueOnce({ tools: [{ name: 'a', inputSchema: { type: 'object' } }], nextCursor: 'p2' })
      .mockResolvedValueOnce({ tools: [{ name: 'b', inputSchema: { type: 'object' } }] });
    const fake = makeFakeClient({ listTools });
    const session = await connectWith(fake);

    expect(await listMcpTools(session)).toSucceedAndSatisfy((tools: ReadonlyArray<IMcpToolDescriptor>) => {
      expect(tools.map((t) => t.name)).toEqual(['a', 'b']);
    });
    expect(listTools).toHaveBeenNthCalledWith(1, undefined);
    expect(listTools).toHaveBeenNthCalledWith(2, { cursor: 'p2' });
  });

  test('coerces a missing/invalid inputSchema to null and a missing description to undefined', async () => {
    const fake = makeFakeClient({
      listTools: jest.fn(async () => ({ tools: [{ name: 'noschema' }] }))
    });
    const session = await connectWith(fake);
    expect(await listMcpTools(session)).toSucceedAndSatisfy((tools: ReadonlyArray<IMcpToolDescriptor>) => {
      expect(tools[0]).toEqual({ name: 'noschema', description: undefined, inputSchema: null });
    });
  });

  test('fails when listTools throws', async () => {
    const fake = makeFakeClient({
      listTools: jest.fn(async () => {
        throw new Error('protocol error');
      })
    });
    const session = await connectWith(fake);
    expect(await listMcpTools(session)).toFailWith(/listMcpTools:.*protocol error/);
  });
});

describe('callMcpTool', () => {
  const args: JsonObject = { q: 'hi' };

  test('fails loudly for a foreign session handle', async () => {
    expect(await callMcpTool(FOREIGN_SESSION, 'a', args)).toFailWith(/invalid MCP session/);
  });

  test('concatenates text blocks', async () => {
    const fake = makeFakeClient({
      callTool: jest.fn(async () => ({
        content: [
          { type: 'text', text: 'line one' },
          { type: 'text', text: 'line two' }
        ]
      }))
    });
    const session = await connectWith(fake);
    expect(await callMcpTool(session, 'a', args)).toSucceedWith({
      content: 'line one\nline two'
    });
    expect(fake.callTool).toHaveBeenCalledWith({ name: 'a', arguments: args });
  });

  test('summarizes non-text blocks', async () => {
    const fake = makeFakeClient({
      callTool: jest.fn(async () => ({
        content: [
          { type: 'text', text: 'caption' },
          { type: 'image', data: 'base64==' }
        ]
      }))
    });
    const session = await connectWith(fake);
    expect(await callMcpTool(session, 'a', args)).toSucceedWith({
      content: 'caption\n[image block]'
    });
  });

  test('projects an empty/absent content list to an empty string', async () => {
    const fake = makeFakeClient({ callTool: jest.fn(async () => ({})) });
    const session = await connectWith(fake);
    expect(await callMcpTool(session, 'a', args)).toSucceedWith({ content: '' });
  });

  test('maps isError:true to a Failure carrying the projected content', async () => {
    const fake = makeFakeClient({
      callTool: jest.fn(async () => ({ content: [{ type: 'text', text: 'bad input' }], isError: true }))
    });
    const session = await connectWith(fake);
    expect(await callMcpTool(session, 'a', args)).toFailWith(/^bad input$/);
  });

  test('maps isError:true with no content to a generic error', async () => {
    const fake = makeFakeClient({ callTool: jest.fn(async () => ({ isError: true })) });
    const session = await connectWith(fake);
    expect(await callMcpTool(session, 'broken', args)).toFailWith(/tool 'broken' reported an error/);
  });

  test('fails when callTool throws', async () => {
    const fake = makeFakeClient({
      callTool: jest.fn(async () => {
        throw new Error('timeout');
      })
    });
    const session = await connectWith(fake);
    expect(await callMcpTool(session, 'a', args)).toFailWith(/callMcpTool 'a':.*timeout/);
  });
});

// ===========================================================================
// adaptMcpTools — the headline (Constraint 1)
// ===========================================================================

describe('adaptMcpTools', () => {
  const goodSchema: JsonValue = {
    type: 'object',
    properties: { q: { type: 'string' } },
    required: ['q']
  };
  // `pattern` is outside the JsonSchema.fromJson supported subset → fromJson fails with a pointer.
  const forbiddenSchema: JsonValue = {
    type: 'object',
    properties: { name: { type: 'string', pattern: '^a' } }
  };

  function mixedCatalogClient(): IFakeClient {
    return makeFakeClient({
      listTools: jest.fn(async () => ({
        tools: [
          { name: 'good', description: 'a good tool', inputSchema: goodSchema },
          { name: 'forbidden', inputSchema: forbiddenSchema },
          { name: 'nonobject', description: 'bad', inputSchema: 'not-a-schema' }
        ]
      }))
    });
  }

  test('propagates a tool-discovery failure', async () => {
    const fake = makeFakeClient({
      listTools: jest.fn(async () => {
        throw new Error('discovery down');
      })
    });
    const session = await connectWith(fake);
    expect(await adaptMcpTools(session)).toFailWith(/adaptMcpTools:.*discovery down/);
  });

  test('adapts good tools and surfaces skipped tools structurally + NOISY warn', async () => {
    const logger = new Logging.InMemoryLogger('all');
    const session = await connectWith(mixedCatalogClient());

    expect(await adaptMcpTools(session, { logger })).toSucceedAndSatisfy((result: IAdaptMcpToolsResult) => {
      expect(result.tools).toHaveLength(1);
      expect(result.tools[0].config.name).toBe('good');
      expect(result.tools[0].config.description).toBe('a good tool');

      expect(result.skipped).toHaveLength(2);
      const byName = new Map(result.skipped.map((s) => [s.name, s]));
      expect(byName.get('forbidden')?.reason).toMatch(/pattern/);
      expect(byName.get('forbidden')?.schema).toEqual(forbiddenSchema);
      expect(byName.get('nonobject')?.reason).toMatch(/not a JSON object/);
      expect(byName.get('nonobject')?.schema).toBe('not-a-schema');
    });

    // NOISY warn: tool name + pointer reason + the raw failing schema verbatim.
    const warned = logger.logged.join('\n');
    expect(warned).toMatch(/skipping tool 'forbidden'/);
    expect(warned).toMatch(/pattern/);
    expect(warned).toContain(JSON.stringify(forbiddenSchema));
    expect(warned).toMatch(/skipping tool 'nonobject'/);
  });

  test('surfaces skips structurally even without a logger', async () => {
    const session = await connectWith(mixedCatalogClient());
    expect(await adaptMcpTools(session)).toSucceedAndSatisfy((result: IAdaptMcpToolsResult) => {
      expect(result.tools).toHaveLength(1);
      expect(result.skipped).toHaveLength(2);
    });
  });

  test('falls back to the tool name when no description is provided', async () => {
    const fake = makeFakeClient({
      listTools: jest.fn(async () => ({ tools: [{ name: 'nodesc', inputSchema: goodSchema }] }))
    });
    const session = await connectWith(fake);
    expect(await adaptMcpTools(session)).toSucceedAndSatisfy((result: IAdaptMcpToolsResult) => {
      expect(result.tools[0].config.description).toBe('nodesc');
    });
  });

  describe('adapted tool execute', () => {
    async function adaptGood(callTool: jest.Mock): Promise<(args: unknown) => Promise<Result<unknown>>> {
      const fake = makeFakeClient({
        listTools: jest.fn(async () => ({ tools: [{ name: 'good', inputSchema: goodSchema }] })),
        callTool
      });
      const session = await connectWith(fake);
      const result = (await adaptMcpTools(session)).orThrow();
      return result.tools[0].execute;
    }

    test('forwards validated args to callMcpTool and returns the projected content', async () => {
      const callTool = jest.fn(async () => ({ content: [{ type: 'text', text: 'tool output' }] }));
      const execute = await adaptGood(callTool);
      expect(await execute({ q: 'hello' })).toSucceedWith('tool output');
      expect(callTool).toHaveBeenCalledWith({ name: 'good', arguments: { q: 'hello' } });
    });

    test('fails when the model supplies non-object arguments', async () => {
      const callTool = jest.fn();
      const execute = await adaptGood(callTool);
      expect(await execute('not-an-object')).toFailWith(/tool 'good': arguments must be a JSON object/);
      expect(callTool).not.toHaveBeenCalled();
    });

    test('propagates an MCP tool error as a Failure', async () => {
      const callTool = jest.fn(async () => ({ content: [{ type: 'text', text: 'denied' }], isError: true }));
      const execute = await adaptGood(callTool);
      expect(await execute({ q: 'hello' })).toFailWith(/denied/);
    });
  });
});
