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
 * Public types for the MCP → ai-assist client-tools boundary.
 * @packageDocumentation
 */

import { type Logging } from '@fgv/ts-utils';
import { type AiAssist } from '@fgv/ts-extras';
import { type JsonValue } from '@fgv/ts-json-base';

// ============================================================================
// Transport
// ============================================================================

/**
 * Parameters for {@link createStdioTransport}. The transport spawns `command` as a
 * subprocess and speaks MCP over its stdin/stdout.
 *
 * @remarks
 * **Security:** stdio transport executes a consumer-supplied command. Treat `command`/`args`
 * as a trust boundary — never source them from untrusted input. See the package README.
 *
 * @public
 */
export interface IMcpStdioTransportParams {
  /** Executable to spawn (e.g. `'npx'`, `'node'`, an absolute path). */
  readonly command: string;
  /** Arguments passed to the command. */
  readonly args?: ReadonlyArray<string>;
  /** Environment variables for the spawned process. When omitted, the SDK's safe default set is used. */
  readonly env?: Record<string, string>;
  /** Working directory for the spawned process. */
  readonly cwd?: string;
}

/**
 * Parameters for {@link createHttpTransport}. The transport connects to a Streamable-HTTP MCP
 * endpoint.
 * @public
 */
export interface IMcpHttpTransportParams {
  /** Absolute `http`/`https` URL of the MCP server endpoint. */
  readonly url: string;
  /** Optional static headers (e.g. an `Authorization` bearer token). OAuth/managed auth is out of scope at v0.1. */
  readonly headers?: Record<string, string>;
}

/**
 * Opaque handle to an MCP transport produced by {@link createStdioTransport} or
 * {@link createHttpTransport}. Hand it to {@link connectMcpSession}; do not construct directly.
 * @public
 */
export interface IMcpTransport {
  /** Which transport kind this handle wraps. */
  readonly transportKind: 'stdio' | 'http';
}

// ============================================================================
// Session
// ============================================================================

/**
 * Parameters for {@link connectMcpSession}.
 * @public
 */
export interface IConnectMcpSessionParams {
  /** A transport produced by {@link createStdioTransport} / {@link createHttpTransport}. */
  readonly transport: IMcpTransport;
  /** Client name advertised to the server during the initialize handshake. Default `'@fgv/ts-extras-mcp'`. */
  readonly clientName?: string;
  /** Client version advertised to the server. Default the package version. */
  readonly clientVersion?: string;
  /** Optional logger for connection diagnostics. */
  readonly logger?: Logging.ILogger;
}

/**
 * Server identity reported during the MCP initialize handshake.
 * @public
 */
export interface IMcpServerInfo {
  /** Server-advertised name. */
  readonly name: string;
  /** Server-advertised version. */
  readonly version: string;
}

/**
 * Opaque handle to a connected MCP session. Pass it to {@link listMcpTools},
 * {@link callMcpTool}, {@link adaptMcpTools}, and {@link closeMcpSession}.
 * @public
 */
export interface IMcpSession {
  /** Client name advertised during the handshake. */
  readonly clientName: string;
  /** Client version advertised during the handshake. */
  readonly clientVersion: string;
  /** Server identity reported by the handshake, when the server provided one. */
  readonly serverInfo: IMcpServerInfo | undefined;
}

// ============================================================================
// Tool discovery + invocation
// ============================================================================

/**
 * A tool descriptor discovered from an MCP server via {@link listMcpTools}.
 * @public
 */
export interface IMcpToolDescriptor {
  /** Tool name (unique within a server). */
  readonly name: string;
  /** Human-readable description, when the server provided one. */
  readonly description: string | undefined;
  /**
   * The tool's declared input schema as raw JSON. Per the MCP spec this is normally a JSON
   * Schema object; carried verbatim so {@link adaptMcpTools} can run it through
   * `JsonSchema.fromJson` (and surface it on {@link IMcpSkippedTool} when it is outside the
   * supported subset).
   */
  readonly inputSchema: JsonValue;
}

/**
 * Successful projection of an MCP `CallToolResult` produced by {@link callMcpTool}.
 *
 * @remarks
 * `content` is the text concatenation of the result's `text` blocks; non-text blocks
 * (image / audio / resource) are projected to a one-line `[<type> block]` summary
 * (multimodal passthrough is out of scope at v0.1). A result with `isError: true` is mapped
 * to `Result.fail(content)` rather than returned here, so it is never silently swallowed.
 *
 * @public
 */
export interface IMcpToolCallResult {
  /** The projected text content of the tool result. */
  readonly content: string;
}

// ============================================================================
// Adapter (Constraint 1)
// ============================================================================

/**
 * A tool that was discovered but could NOT be adapted into an `AiAssist.IAiClientTool`,
 * because its `inputSchema` is outside the JSON Schema subset supported by
 * `JsonSchema.fromJson`. Surfaced structurally so callers/the probe can enumerate exactly which
 * subset features a server needs (with the raw schema in hand to extend `fromJson` later).
 * @public
 */
export interface IMcpSkippedTool {
  /** The tool's name. */
  readonly name: string;
  /** Why the tool was skipped — the JSON-pointer reason from `JsonSchema.fromJson`, or a structural reason. */
  readonly reason: string;
  /** The raw failing input schema, verbatim, in hand for additively widening `JsonSchema.fromJson`. */
  readonly schema: JsonValue;
}

/**
 * Options for {@link adaptMcpTools}.
 * @public
 */
export interface IAdaptMcpToolsOptions {
  /**
   * Logger for the NOISY per-tool skip warnings. When a tool is skipped, a `warning` is emitted
   * including the tool name, the JSON-pointer reason, and the raw failing schema. When omitted,
   * skips are still surfaced structurally on {@link IAdaptMcpToolsResult.skipped}.
   */
  readonly logger?: Logging.ILogger;
}

/**
 * The result of {@link adaptMcpTools}: cleanly-adapted client tools plus the structurally-surfaced
 * set of tools that could not be adapted (graceful degradation, Constraint 1).
 * @public
 */
export interface IAdaptMcpToolsResult {
  /** Tools adapted into `IAiClientTool` — safe to hand to `AiAssist.executeClientToolTurn`. */
  readonly tools: ReadonlyArray<AiAssist.IAiClientTool>;
  /** Tools excluded because their `inputSchema` is outside the supported JSON Schema subset. */
  readonly skipped: ReadonlyArray<IMcpSkippedTool>;
}
