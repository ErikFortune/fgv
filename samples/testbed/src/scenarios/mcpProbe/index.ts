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
 * `mcp-probe` scenario (CLI-only) — Constraint 2 of the `ts-extras-mcp` stream.
 *
 * Points `@fgv/ts-extras-mcp` at any MCP server and prints a compatibility report: which of the
 * server's tools adapt cleanly into ai-assist client tools, and for each that does NOT, the tool
 * name + the JSON-pointer reason + the raw failing schema. Diagnostic, not showcase — run it
 * against any MCP server to assess support without wiring it into an application.
 *
 * **Usage.** Supply the server spec via environment variables (the testbed CLI dispatch does not
 * forward trailing argv to scenarios):
 *
 * ```sh
 * # stdio server (spawns a subprocess — trust boundary; see @fgv/ts-extras-mcp README):
 * MCP_PROBE_COMMAND=npx MCP_PROBE_ARGS="-y @modelcontextprotocol/server-everything" \
 *   node bin/testbed.js --scenario mcp-probe
 *
 * # HTTP server:
 * MCP_PROBE_URL=http://localhost:3001/mcp MCP_PROBE_HEADERS="authorization=Bearer xyz" \
 *   node bin/testbed.js --scenario mcp-probe
 * ```
 *
 * **CLI-only by design.** The MCP SDK is node-native (it spawns subprocesses for stdio servers),
 * so the package is loaded via a `webpackIgnore` dynamic import (the `local-summarization`
 * pattern) and never enters the web bundle graph.
 *
 * @packageDocumentation
 */

import { fail } from '@fgv/ts-utils';
import type { Result } from '@fgv/ts-utils';

import type { IScenario, ICliScenarioImpl, IScenarioContext } from '../../shell';
import { type IMcpProbeDeps, parseMcpProbeSpecFromEnv, runMcpProbe } from './probe';

const cliImpl: ICliScenarioImpl = {
  /* c8 ignore start - orchestration seam: wires the node-native @fgv/ts-extras-mcp deps via a
     webpackIgnore dynamic import and requires a live MCP server. The probe logic (spec parsing,
     run orchestration, report formatting) is fully covered via injected deps in probe.test.ts;
     this method's behavior (e.g. the no-spec failure) is exercised there too, but the line/branch
     coverage of the dynamic-import wiring cannot be unit-measured. */
  async run(context: IScenarioContext): Promise<Result<string>> {
    const specResult = parseMcpProbeSpecFromEnv(process.env);
    if (specResult.isFailure()) {
      return fail(specResult.message);
    }

    const mcp = await import(/* webpackIgnore: true */ '@fgv/ts-extras-mcp');
    const deps: IMcpProbeDeps = {
      connect: async (spec, logger) => {
        const transport =
          spec.kind === 'http'
            ? mcp.createHttpTransport({ url: spec.url, headers: spec.headers })
            : mcp.createStdioTransport({ command: spec.command, args: spec.args, cwd: spec.cwd });
        if (transport.isFailure()) {
          return fail(transport.message);
        }
        return mcp.connectMcpSession({ transport: transport.value, logger });
      },
      adapt: (session, logger) => mcp.adaptMcpTools(session, { logger }),
      close: (session) => mcp.closeMcpSession(session)
    };
    return runMcpProbe(specResult.value, deps, context.logger);
  }
  /* c8 ignore stop */
};

/**
 * The MCP compatibility-probe scenario (CLI-only). Registered in `scenarios/index.ts`.
 * @public
 */
export const mcpProbeScenario: IScenario = {
  id: 'mcp-probe',
  title: 'MCP Compatibility Probe',
  description:
    'Point @fgv/ts-extras-mcp at any MCP server and report which tools adapt into ai-assist ' +
    'client tools and which are skipped (with the failing schema + reason). Configure via ' +
    'MCP_PROBE_URL or MCP_PROBE_COMMAND. CLI-only.',
  category: 'ai',
  tags: ['mcp', 'client-tools', 'ai-assist', 'diagnostic', 'cli'],
  cli: cliImpl
};
