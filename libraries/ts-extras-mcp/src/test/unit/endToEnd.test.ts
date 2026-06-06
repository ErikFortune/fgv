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
 * End-to-end verification against a REAL in-memory MCP server (the SDK's `Server` +
 * `InMemoryTransport.createLinkedPair()`) — NOT a mocked SDK. This is the durable proof that the
 * brief's two load-bearing constraints actually flow through the full stack: the real SDK `Client`,
 * the real initialize handshake, the real `listTools`/`callTool` round-trips, the `sdk.ts`
 * projection casts, and `adaptMcpTools`' `JsonSchema.fromJson` gate. It is the class of gap that
 * 100%-line-coverage of a mocked seam cannot catch (e.g. a projection-shape mismatch in `sdk.ts`).
 *
 * The fixture server advertises a MIX of tools: two adaptable, and one for each JSON Schema feature
 * `JsonSchema.fromJson` rejects ($ref, oneOf, anyOf, pattern, union `type[]`).
 */

import '@fgv/ts-utils-jest';
import { Logging } from '@fgv/ts-utils';

// Real MCP SDK server side — exercised over an in-process linked transport pair. Subpath imports
// resolve via the tsconfig `paths` mapping (the same seam the package's sdk.ts uses).
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import {
  type IMcpSession,
  adaptMcpTools,
  callMcpTool,
  closeMcpSession,
  connectMcpSession,
  listMcpTools
} from '../../packlets/mcp';
// Internal: the opaque-handle class. The package exposes only stdio/http transport factories, so a
// real in-process e2e (which must inject the SDK's InMemoryTransport) wraps it here. Tests may
// import internal modules directly (TESTING_GUIDELINES § Testing Internal Code).
// eslint-disable-next-line @rushstack/packlets/mechanics
import { McpTransport } from '../../packlets/mcp/transports';

// ---------------------------------------------------------------------------
// Fixture server — a real SDK Server advertising a mix of adaptable + un-adaptable tools.
// ---------------------------------------------------------------------------

/** The two adaptable tools (in the supported JSON Schema subset). */
const ADAPTABLE_TOOLS = [
  {
    name: 'echo',
    description: 'Echoes the supplied message back.',
    inputSchema: {
      type: 'object',
      properties: { msg: { type: 'string', description: 'message to echo' } },
      required: ['msg']
    }
  },
  {
    name: 'ping',
    description: 'Health check with no required args.',
    inputSchema: { type: 'object', properties: {} }
  }
];

/**
 * One tool per JSON Schema feature `JsonSchema.fromJson` rejects. Each carries the forbidden
 * keyword NESTED inside a property (the real-world shape: the top-level inputSchema is a valid
 * `type: 'object'`, so the MCP SDK's own result validation lets it through, and the rejection
 * happens in `adaptMcpTools` exactly as a real server would surface it).
 */
const UNADAPTABLE_TOOLS = [
  {
    name: 'ref_tool',
    inputSchema: { type: 'object', properties: { x: { $ref: '#/$defs/Foo' } } }
  },
  {
    name: 'oneof_tool',
    inputSchema: { type: 'object', properties: { x: { oneOf: [{ type: 'string' }, { type: 'number' }] } } }
  },
  {
    name: 'anyof_tool',
    inputSchema: { type: 'object', properties: { x: { anyOf: [{ type: 'string' }, { type: 'number' }] } } }
  },
  {
    name: 'pattern_tool',
    inputSchema: { type: 'object', properties: { code: { type: 'string', pattern: '^[A-Z]+$' } } }
  },
  {
    name: 'union_tool',
    inputSchema: { type: 'object', properties: { x: { type: ['string', 'null'] } } }
  }
];

const ALL_TOOLS = [...ADAPTABLE_TOOLS, ...UNADAPTABLE_TOOLS];

/** Builds and connects a real in-memory MCP server; returns its server-side handle for teardown. */
async function startFixtureServer(): Promise<{ server: Server; clientTransport: InMemoryTransport }> {
  const server = new Server(
    { name: 'fixture-mcp-server', version: '0.0.1' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: ALL_TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'echo') {
      return { content: [{ type: 'text', text: `echo: ${JSON.stringify(args)}` }] };
    }
    if (name === 'ping') {
      return { content: [{ type: 'text', text: 'pong' }] };
    }
    return { content: [{ type: 'text', text: `unknown tool: ${name}` }], isError: true };
  });

  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  return { server, clientTransport };
}

// ---------------------------------------------------------------------------
// End-to-end suite
// ---------------------------------------------------------------------------

describe('@fgv/ts-extras-mcp end-to-end against a real in-memory MCP server', () => {
  let server: Server;
  let session: IMcpSession;

  beforeEach(async () => {
    const fixture = await startFixtureServer();
    server = fixture.server;
    // Wrap the SDK in-memory client transport in the package's opaque handle, then connect through
    // the PUBLIC connectMcpSession (real Client + real initialize handshake).
    const transport = new McpTransport('http', fixture.clientTransport);
    session = (await connectMcpSession({ transport, clientName: 'e2e', clientVersion: '0.0.0' })).orThrow();
  });

  afterEach(async () => {
    await closeMcpSession(session);
    await server.close();
  });

  test('the initialize handshake reports the real server identity', () => {
    expect(session.serverInfo).toEqual({ name: 'fixture-mcp-server', version: '0.0.1' });
  });

  test('listMcpTools returns the full catalog over the real transport', async () => {
    expect(await listMcpTools(session)).toSucceedAndSatisfy((tools) => {
      expect(tools.map((t) => t.name).sort()).toEqual(
        ['anyof_tool', 'echo', 'oneof_tool', 'pattern_tool', 'ping', 'ref_tool', 'union_tool'].sort()
      );
    });
  });

  test('callMcpTool round-trips a real tool result, and maps isError to Failure', async () => {
    expect(await callMcpTool(session, 'echo', { msg: 'hi' })).toSucceedWith({
      content: 'echo: {"msg":"hi"}'
    });
    expect(await callMcpTool(session, 'nope', {})).toFailWith(/unknown tool: nope/);
  });

  // =========================================================================
  // CONSTRAINT 1 — graceful degradation with NOISY, schema-bearing warnings.
  // =========================================================================
  describe('Constraint 1 — adaptMcpTools graceful + NOISY degradation', () => {
    test('excludes EVERY un-adaptable tool from `tools`, surfaces each on `skipped`, warns with the raw schema', async () => {
      const logger = new Logging.InMemoryLogger('all');
      const expectedReasonFragment: Record<string, RegExp> = {
        ref_tool: /\$ref/,
        oneof_tool: /oneOf/,
        anyof_tool: /anyOf/,
        pattern_tool: /pattern/,
        union_tool: /union 'type'/
      };

      expect(await adaptMcpTools(session, { logger })).toSucceedAndSatisfy((result) => {
        // (a) Only the adaptable tools are offered to the model; none of the rejected ones leak.
        expect(result.tools.map((t) => t.config.name).sort()).toEqual(['echo', 'ping']);
        const offeredNames = new Set(result.tools.map((t) => t.config.name));
        for (const t of UNADAPTABLE_TOOLS) {
          expect(offeredNames.has(t.name)).toBe(false);
        }

        // (b) Each un-adaptable tool is surfaced structurally with name + JSON-pointer reason + the
        //     RAW failing schema (verbatim, so the subset can be widened later).
        expect(result.skipped).toHaveLength(UNADAPTABLE_TOOLS.length);
        const skippedByName = new Map(result.skipped.map((s) => [s.name, s]));
        for (const tool of UNADAPTABLE_TOOLS) {
          const skipped = skippedByName.get(tool.name);
          expect(skipped).toBeDefined();
          // JSON-pointer path into the offending node.
          expect(skipped?.reason).toMatch(/#\/properties\//);
          expect(skipped?.reason).toMatch(expectedReasonFragment[tool.name]);
          // The RAW failing schema, verbatim.
          expect(skipped?.schema).toEqual(tool.inputSchema);
        }
      });

      // (c) A NOISY warning per skip that INCLUDES the raw failing schema text + the reason. The
      //     schema-in-the-warning is the whole "so we can extend fromJson later" requirement — a
      //     warn WITHOUT the schema would fail this assertion.
      const warned = logger.logged.join('\n');
      for (const tool of UNADAPTABLE_TOOLS) {
        expect(warned).toContain(`skipping tool '${tool.name}'`);
        // The raw schema, serialized exactly as adaptMcpTools emits it, must appear in the warn.
        expect(warned).toContain(JSON.stringify(tool.inputSchema));
      }
      // And the reason fragments are present in the warnings too.
      expect(warned).toMatch(/\$ref/);
      expect(warned).toMatch(/union 'type'/);
    });

    test('an adapted tool executes end-to-end against the real server', async () => {
      const result = (await adaptMcpTools(session)).orThrow();
      const echo = result.tools.find((t) => t.config.name === 'echo');
      if (echo === undefined) {
        throw new Error('expected the `echo` tool to be adapted');
      }
      // The adapted execute callback round-trips through callMcpTool → the real server.
      expect(await echo.execute({ msg: 'roundtrip' })).toSucceedWith('echo: {"msg":"roundtrip"}');
    });
  });
});
