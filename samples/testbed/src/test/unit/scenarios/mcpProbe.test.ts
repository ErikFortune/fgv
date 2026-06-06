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

import '@fgv/ts-utils-jest';
import { Logging, type Result, fail, succeed } from '@fgv/ts-utils';
import { JsonSchema } from '@fgv/ts-json-base';
import type { IAdaptMcpToolsResult, IMcpSession } from '@fgv/ts-extras-mcp';

import {
  type IMcpProbeDeps,
  type IMcpProbeSpec,
  formatMcpProbeReport,
  parseMcpProbeSpecFromEnv,
  runMcpProbe
} from '../../../scenarios/mcpProbe/probe';
import { mcpProbeScenario } from '../../../scenarios/mcpProbe';
import type { IScenarioContext } from '../../../shell';

/**
 * Builds a structurally valid adapted-tool entry for report-formatting tests — a real
 * `JsonSchema` validator + a no-op `execute`, so the type is checked for real (no `as unknown as`
 * that could mask an `IAiClientTool` / `IAdaptMcpToolsResult` shape regression).
 */
function adaptedTool(name: string): IAdaptMcpToolsResult['tools'][number] {
  return {
    config: { type: 'client_tool', name, description: name, parametersSchema: JsonSchema.object({}) },
    execute: async () => succeed(undefined)
  };
}

// ---------------------------------------------------------------------------
// parseMcpProbeSpecFromEnv
// ---------------------------------------------------------------------------

describe('parseMcpProbeSpecFromEnv', () => {
  test('parses an HTTP spec with headers', () => {
    expect(
      parseMcpProbeSpecFromEnv({
        MCP_PROBE_URL: 'http://localhost:3001/mcp',
        MCP_PROBE_HEADERS: 'authorization=Bearer xyz, x-tenant = acme'
      })
    ).toSucceedWith({
      kind: 'http',
      url: 'http://localhost:3001/mcp',
      headers: { authorization: 'Bearer xyz', 'x-tenant': 'acme' }
    } as IMcpProbeSpec);
  });

  test('parses an HTTP spec without headers (and ignores a blank/invalid header string)', () => {
    expect(parseMcpProbeSpecFromEnv({ MCP_PROBE_URL: 'http://localhost/mcp' })).toSucceedWith({
      kind: 'http',
      url: 'http://localhost/mcp'
    } as IMcpProbeSpec);
    expect(
      parseMcpProbeSpecFromEnv({ MCP_PROBE_URL: 'http://localhost/mcp', MCP_PROBE_HEADERS: 'no-equals' })
    ).toSucceedWith({ kind: 'http', url: 'http://localhost/mcp' } as IMcpProbeSpec);
  });

  test('parses an HTTP spec with an empty-valued header pair', () => {
    expect(
      parseMcpProbeSpecFromEnv({ MCP_PROBE_URL: 'http://h/mcp', MCP_PROBE_HEADERS: 'x-trace=' })
    ).toSucceedWith({ kind: 'http', url: 'http://h/mcp', headers: { 'x-trace': '' } } as IMcpProbeSpec);
  });

  test('parses a stdio spec with args and cwd', () => {
    expect(
      parseMcpProbeSpecFromEnv({
        MCP_PROBE_COMMAND: 'npx',
        MCP_PROBE_ARGS: '-y  @modelcontextprotocol/server-everything',
        MCP_PROBE_CWD: '/srv'
      })
    ).toSucceedWith({
      kind: 'stdio',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-everything'],
      cwd: '/srv'
    } as IMcpProbeSpec);
  });

  test('parses a stdio spec with no args and no cwd', () => {
    expect(parseMcpProbeSpecFromEnv({ MCP_PROBE_COMMAND: 'my-server' })).toSucceedWith({
      kind: 'stdio',
      command: 'my-server',
      args: []
    } as IMcpProbeSpec);
  });

  test('prefers HTTP when both URL and command are present', () => {
    expect(
      parseMcpProbeSpecFromEnv({ MCP_PROBE_URL: 'http://h/mcp', MCP_PROBE_COMMAND: 'cmd' })
    ).toSucceedAndSatisfy((spec: IMcpProbeSpec) => {
      expect(spec.kind).toBe('http');
    });
  });

  test('fails with guidance when no spec is configured', () => {
    expect(parseMcpProbeSpecFromEnv({})).toFailWith(/no server spec found.*MCP_PROBE_URL.*MCP_PROBE_COMMAND/);
    // Whitespace-only values are treated as absent.
    expect(parseMcpProbeSpecFromEnv({ MCP_PROBE_URL: '   ', MCP_PROBE_COMMAND: '  ' })).toFailWith(
      /no server spec found/
    );
  });
});

// ---------------------------------------------------------------------------
// formatMcpProbeReport
// ---------------------------------------------------------------------------

describe('formatMcpProbeReport', () => {
  test('reports a mixed catalog with identity', () => {
    const result: IAdaptMcpToolsResult = {
      tools: [adaptedTool('alpha')],
      skipped: [{ name: 'beta', reason: '#/properties/x: pattern', schema: { type: 'object' } }]
    };
    const report = formatMcpProbeReport('HTTP http://h/mcp', { name: 'srv', version: '2.0' }, result);
    expect(report).toMatch(/Server: HTTP http:\/\/h\/mcp/);
    expect(report).toMatch(/Identity: srv@2.0/);
    expect(report).toMatch(/2 — 1 adapted, 1 skipped/);
    expect(report).toMatch(/✓ alpha/);
    expect(report).toMatch(/✗ beta/);
    expect(report).toMatch(/reason: #\/properties\/x: pattern/);
    expect(report).toContain(JSON.stringify({ type: 'object' }));
    expect(report).toMatch(/additively widened/);
  });

  test('reports an all-clean catalog with no identity', () => {
    const result: IAdaptMcpToolsResult = { tools: [adaptedTool('only')], skipped: [] };
    const report = formatMcpProbeReport('stdio "x"', undefined, result);
    expect(report).toMatch(/Identity: \(not reported\)/);
    expect(report).toMatch(/Skipped[^\n]*\(0\):\n {2}\(none\)/);
  });

  test('reports an empty catalog', () => {
    const result: IAdaptMcpToolsResult = { tools: [], skipped: [] };
    const report = formatMcpProbeReport('stdio "x"', undefined, result);
    expect(report).toMatch(/Adapted cleanly \(0\):\n {2}\(none\)/);
  });
});

// ---------------------------------------------------------------------------
// runMcpProbe (deps-injected)
// ---------------------------------------------------------------------------

describe('runMcpProbe', () => {
  const httpSpec: IMcpProbeSpec = { kind: 'http', url: 'http://h/mcp' };
  const stdioSpec: IMcpProbeSpec = { kind: 'stdio', command: 'cmd', args: ['--flag'] };
  const fakeSession = { serverInfo: { name: 'srv', version: '1.0' } } as unknown as IMcpSession;

  function makeDeps(overrides: Partial<IMcpProbeDeps> = {}): { deps: IMcpProbeDeps; close: jest.Mock } {
    const close = jest.fn(async (): Promise<Result<true>> => succeed(true));
    const deps: IMcpProbeDeps = {
      connect: jest.fn(async () => succeed(fakeSession)),
      adapt: jest.fn(async (): Promise<Result<IAdaptMcpToolsResult>> => succeed({ tools: [], skipped: [] })),
      close,
      ...overrides
    };
    return { deps, close };
  }

  test('connects, adapts, and prints the per-tool adapt/skip report for EVERY rejection class', async () => {
    // Constraint 2: the probe must enumerate ALL adaptation errors, with the raw schema + reason
    // per skip. The mixed result below mirrors the exact `IAdaptMcpToolsResult` shape that the real
    // `adaptMcpTools` emits from a real server — proven against an in-memory MCP server in
    // `@fgv/ts-extras-mcp`'s endToEnd.test.ts (one skip per fromJson-rejected feature). Composed,
    // those two tests are an end-to-end proof: real server → real adapter output → real probe report.
    const adaptResult: IAdaptMcpToolsResult = {
      tools: [adaptedTool('echo'), adaptedTool('ping')],
      skipped: [
        {
          name: 'ref_tool',
          reason: "#/properties/x: unsupported JSON Schema keyword '$ref'",
          schema: { type: 'object', properties: { x: { $ref: '#/$defs/Foo' } } }
        },
        {
          name: 'oneof_tool',
          reason: "#/properties/x: unsupported JSON Schema keyword 'oneOf'",
          schema: { type: 'object', properties: { x: { oneOf: [] } } }
        },
        {
          name: 'anyof_tool',
          reason: "#/properties/x: unsupported JSON Schema keyword 'anyOf'",
          schema: { type: 'object', properties: { x: { anyOf: [] } } }
        },
        {
          name: 'pattern_tool',
          reason: "#/properties/code: unsupported JSON Schema keyword 'pattern'",
          schema: { type: 'object', properties: { code: { type: 'string', pattern: '^[A-Z]+$' } } }
        },
        {
          name: 'union_tool',
          reason: "#/properties/x: union 'type' arrays are not supported",
          schema: { type: 'object', properties: { x: { type: ['string', 'null'] } } }
        }
      ]
    };
    const { deps, close } = makeDeps({ adapt: jest.fn(async () => succeed(adaptResult)) });

    expect(await runMcpProbe(stdioSpec, deps, new Logging.InMemoryLogger())).toSucceedAndSatisfy(
      (report: string) => {
        expect(report).toMatch(/stdio "cmd --flag"/);
        expect(report).toMatch(/Identity: srv@1.0/);
        expect(report).toMatch(/Tools discovered: 7 — 2 adapted, 5 skipped/);
        // Adapted tools listed.
        expect(report).toMatch(/✓ echo/);
        expect(report).toMatch(/✓ ping/);
        // EVERY skipped tool surfaced with its name, JSON-pointer reason, AND raw schema verbatim.
        for (const skipped of adaptResult.skipped) {
          expect(report).toContain(`✗ ${skipped.name}`);
          expect(report).toContain(`reason: ${skipped.reason}`);
          expect(report).toContain(`schema: ${JSON.stringify(skipped.schema)}`);
        }
        // The "so we can extend fromJson later" framing is present.
        expect(report).toMatch(/additively widened in @fgv\/ts-json-base/);
      }
    );
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('describes an HTTP target in the report', async () => {
    const { deps } = makeDeps();
    expect(await runMcpProbe(httpSpec, deps, new Logging.InMemoryLogger())).toSucceedAndSatisfy(
      (report: string) => {
        expect(report).toMatch(/Server: HTTP http:\/\/h\/mcp/);
      }
    );
  });

  test('fails when connect fails (and does not attempt to close)', async () => {
    const { deps, close } = makeDeps({
      connect: jest.fn(async (): Promise<Result<IMcpSession>> => fail('connection refused'))
    });
    expect(await runMcpProbe(httpSpec, deps, new Logging.InMemoryLogger())).toFailWith(
      /mcp-probe: connection refused/
    );
    expect(close).not.toHaveBeenCalled();
  });

  test('fails when adapt fails but still closes the session', async () => {
    const { deps, close } = makeDeps({
      adapt: jest.fn(async (): Promise<Result<IAdaptMcpToolsResult>> => fail('discovery down'))
    });
    expect(await runMcpProbe(httpSpec, deps, new Logging.InMemoryLogger())).toFailWith(
      /mcp-probe: discovery down/
    );
    expect(close).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Scenario metadata
// ---------------------------------------------------------------------------

describe('mcpProbeScenario', () => {
  test('is a CLI-only ai scenario', () => {
    expect(mcpProbeScenario.id).toBe('mcp-probe');
    expect(mcpProbeScenario.category).toBe('ai');
    expect(mcpProbeScenario.cli).toBeDefined();
    expect(mcpProbeScenario.web).toBeUndefined();
  });

  test('cli.run fails (before the live-server seam) when no spec is in the environment', async () => {
    const saved = {
      url: process.env.MCP_PROBE_URL,
      command: process.env.MCP_PROBE_COMMAND
    };
    delete process.env.MCP_PROBE_URL;
    delete process.env.MCP_PROBE_COMMAND;
    try {
      const context = {
        logger: new Logging.LogReporter<unknown>({ logger: new Logging.InMemoryLogger() })
      } as unknown as IScenarioContext;
      if (!mcpProbeScenario.cli) {
        throw new Error('expected a CLI implementation');
      }
      expect(await mcpProbeScenario.cli.run(context)).toFailWith(/no server spec found/);
    } finally {
      if (saved.url !== undefined) {
        process.env.MCP_PROBE_URL = saved.url;
      }
      if (saved.command !== undefined) {
        process.env.MCP_PROBE_COMMAND = saved.command;
      }
    }
  });
});
