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
 * Pure (deps-injected) core of the MCP compatibility probe — the diagnostic that points
 * `@fgv/ts-extras-mcp` at any MCP server and reports which tools adapt cleanly into ai-assist
 * client tools and which do not (with the failing schema + JSON-pointer reason in hand).
 *
 * The connect / adapt / close primitives are injected via {@link IMcpProbeDeps} so this module is
 * fully unit-testable without a live MCP server; the scenario wires the real `@fgv/ts-extras-mcp`
 * deps at the orchestration seam.
 *
 * @packageDocumentation
 */

import { type Logging, type Result, fail, succeed } from '@fgv/ts-utils';
// Type-only — erased at compile time, so the node-native MCP SDK never enters the web bundle.
import type { IAdaptMcpToolsResult, IMcpSession } from '@fgv/ts-extras-mcp';

/**
 * A parsed MCP server spec: either a stdio subprocess or an HTTP endpoint.
 */
export type IMcpProbeSpec =
  | { readonly kind: 'stdio'; readonly command: string; readonly args: string[]; readonly cwd?: string }
  | { readonly kind: 'http'; readonly url: string; readonly headers?: Record<string, string> };

/**
 * The MCP operations the probe depends on, injected so the orchestration is testable without a
 * live server. The scenario supplies real implementations backed by `@fgv/ts-extras-mcp`.
 */
export interface IMcpProbeDeps {
  /** Connect to the server described by `spec`. */
  readonly connect: (spec: IMcpProbeSpec, logger: Logging.ILogger) => Promise<Result<IMcpSession>>;
  /** Adapt the connected server's tools, surfacing skips. */
  readonly adapt: (session: IMcpSession, logger: Logging.ILogger) => Promise<Result<IAdaptMcpToolsResult>>;
  /** Close the session (best-effort teardown). */
  readonly close: (session: IMcpSession) => Promise<Result<true>>;
}

/**
 * Parses an {@link IMcpProbeSpec} from environment variables.
 *
 * - `MCP_PROBE_URL` (+ optional `MCP_PROBE_HEADERS` as `k=v,k=v`) selects the HTTP transport.
 * - otherwise `MCP_PROBE_COMMAND` (+ optional whitespace-split `MCP_PROBE_ARGS`, `MCP_PROBE_CWD`)
 *   selects the stdio transport.
 *
 * The testbed CLI dispatch does not forward trailing argv to scenarios, and resolves other inputs
 * from the environment; the probe follows that idiom.
 *
 * @param env - The environment record (`process.env` in production; a fixture in tests).
 * @returns The parsed spec, or a `Failure` describing the missing configuration.
 */
export function parseMcpProbeSpecFromEnv(env: Record<string, string | undefined>): Result<IMcpProbeSpec> {
  const url = env.MCP_PROBE_URL?.trim();
  if (url !== undefined && url.length > 0) {
    const headers = _parseHeaders(env.MCP_PROBE_HEADERS);
    return succeed(headers !== undefined ? { kind: 'http', url, headers } : { kind: 'http', url });
  }

  const command = env.MCP_PROBE_COMMAND?.trim();
  if (command !== undefined && command.length > 0) {
    const args = (env.MCP_PROBE_ARGS ?? '').split(/\s+/).filter((a) => a.length > 0);
    const cwd = env.MCP_PROBE_CWD?.trim();
    return succeed(
      cwd !== undefined && cwd.length > 0
        ? { kind: 'stdio', command, args, cwd }
        : { kind: 'stdio', command, args }
    );
  }

  return fail(
    'mcp-probe: no server spec found. Set MCP_PROBE_URL (HTTP) or MCP_PROBE_COMMAND (+ optional ' +
      'MCP_PROBE_ARGS) for a stdio server. Example: MCP_PROBE_COMMAND=npx ' +
      'MCP_PROBE_ARGS="-y @modelcontextprotocol/server-everything"'
  );
}

/** Parses a `k=v,k=v` header string. Returns `undefined` when empty (no header pairs found). */
function _parseHeaders(raw: string | undefined): Record<string, string> | undefined {
  if (raw === undefined || raw.trim().length === 0) {
    return undefined;
  }
  const headers: Record<string, string> = {};
  for (const pair of raw.split(',')) {
    const eq = pair.indexOf('=');
    if (eq > 0) {
      const key = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      if (key.length > 0) {
        headers[key] = value;
      }
    }
  }
  return Object.keys(headers).length > 0 ? headers : undefined;
}

/** Describes the spec's target in a single human-readable line for the report header. */
function _describeTarget(spec: IMcpProbeSpec): string {
  return spec.kind === 'http' ? `HTTP ${spec.url}` : `stdio "${[spec.command, ...spec.args].join(' ')}"`;
}

/**
 * Formats the probe's compatibility report.
 *
 * @param target - A human-readable description of the probed server.
 * @param serverInfo - The server's reported identity, when available.
 * @param result - The adapter result (cleanly-adapted tools + structurally-surfaced skips).
 * @returns The full multi-line report string.
 */
export function formatMcpProbeReport(
  target: string,
  serverInfo: { name: string; version: string } | undefined,
  result: IAdaptMcpToolsResult
): string {
  const total = result.tools.length + result.skipped.length;
  const lines: string[] = [
    'mcp-probe — MCP → ai-assist client-tools compatibility report',
    '',
    `Server: ${target}`,
    `Identity: ${serverInfo !== undefined ? `${serverInfo.name}@${serverInfo.version}` : '(not reported)'}`,
    `Tools discovered: ${total} — ${result.tools.length} adapted, ${result.skipped.length} skipped`,
    ''
  ];

  lines.push(`Adapted cleanly (${result.tools.length}):`);
  if (result.tools.length === 0) {
    lines.push('  (none)');
  } else {
    for (const tool of result.tools) {
      lines.push(`  ✓ ${tool.config.name}`);
    }
  }
  lines.push('');

  lines.push(`Skipped — inputSchema outside the supported JSON Schema subset (${result.skipped.length}):`);
  if (result.skipped.length === 0) {
    lines.push('  (none)');
  } else {
    for (const skipped of result.skipped) {
      lines.push(`  ✗ ${skipped.name}`);
      lines.push(`      reason: ${skipped.reason}`);
      lines.push(`      schema: ${JSON.stringify(skipped.schema)}`);
    }
    lines.push('');
    lines.push(
      'Each skipped tool names a JSON Schema feature `JsonSchema.fromJson` does not yet support. ' +
        'The raw schema is printed so the subset can be additively widened in @fgv/ts-json-base.'
    );
  }

  return lines.join('\n');
}

/**
 * Runs the probe end-to-end over the injected deps: connect → adapt → format → close. The session
 * is always closed (best-effort) once adaptation completes or fails.
 *
 * @param spec - The parsed server spec.
 * @param deps - Injected MCP operations.
 * @param logger - Logger threaded to connect/adapt (the NOISY skip warnings surface here).
 * @returns The compatibility report on success, or a `Failure` if connect/adapt fails.
 */
export async function runMcpProbe(
  spec: IMcpProbeSpec,
  deps: IMcpProbeDeps,
  logger: Logging.ILogger
): Promise<Result<string>> {
  const connectResult = await deps.connect(spec, logger);
  if (connectResult.isFailure()) {
    return fail(`mcp-probe: ${connectResult.message}`);
  }
  const session = connectResult.value;

  const adaptResult = await deps.adapt(session, logger);
  await deps.close(session);

  return adaptResult
    .onSuccess((result) => succeed(formatMcpProbeReport(_describeTarget(spec), session.serverInfo, result)))
    .withErrorFormat((msg) => `mcp-probe: ${msg}`);
}
