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
 * The minimal structural shape of an MCP SDK client transport, accepted by
 * {@link createCustomTransport}.
 *
 * @remarks
 * Every `@modelcontextprotocol/sdk` client transport satisfies this shape — the SDK's
 * `InMemoryTransport` (for tests against an in-process server), `SSEClientTransport`,
 * `WebSocketClientTransport`, or a consumer's own `Transport` implementation. It is declared
 * structurally so this package's public surface never names an SDK type; the SDK's own `Transport`
 * interface is what the object must actually implement at runtime, because the SDK client takes
 * ownership of it (assigning its `onmessage` / `onclose` / `onerror` callbacks) when the session
 * connects.
 *
 * @public
 */
export interface IMcpSdkTransport {
  /** Starts the transport. Called by the SDK client during {@link connectMcpSession}. */
  start(): Promise<void>;
  /** Sends one JSON-RPC message. */
  send(message: unknown, options?: unknown): Promise<void>;
  /** Closes the transport. */
  close(): Promise<void>;
}

/**
 * Which kind of transport an {@link IMcpTransport} handle wraps: one this package constructed
 * (`'stdio'`, `'http'`), or a consumer-supplied SDK transport (`'custom'`).
 * @public
 */
export type McpTransportKind = 'stdio' | 'http' | 'custom';

/**
 * Opaque handle to an MCP transport produced by {@link createStdioTransport},
 * {@link createHttpTransport} or {@link createCustomTransport}. Hand it to
 * {@link connectMcpSession}; do not construct directly.
 *
 * @remarks
 * A handle is single-use: the session that connects over it owns the underlying transport, and
 * closing that session closes the transport.
 * @public
 */
export interface IMcpTransport {
  /** Which transport kind this handle wraps. */
  readonly transportKind: McpTransportKind;
}

// ============================================================================
// Session
// ============================================================================

/**
 * Parameters for {@link connectMcpSession}.
 * @public
 */
export interface IConnectMcpSessionParams {
  /**
   * A transport produced by {@link createStdioTransport}, {@link createHttpTransport} or
   * {@link createCustomTransport}.
   */
  readonly transport: IMcpTransport;
  /** Client name advertised to the server during the initialize handshake. Default `'@fgv/ts-extras-mcp'`. */
  readonly clientName?: string;
  /** Client version advertised to the server. Default the package version. */
  readonly clientVersion?: string;
  /** Optional logger for connection diagnostics. */
  readonly logger?: Logging.ILogger;
  /**
   * Called once when the session's connection closes, for any reason: the server process exited,
   * the transport failed, or {@link closeMcpSession} was called. It is never called for a session
   * whose connect failed, and never more than once.
   *
   * @remarks
   * This is an observation, not a policy: the package never reconnects. A consumer that pools
   * sessions uses it to retire a dead session before its next call rather than after. A call made
   * on a closed session fails with the `'not-connected'` {@link McpFailureReason}.
   *
   * The callback runs inside the SDK's close handling. A throw from it is caught (and logged to
   * `logger`, when one is supplied) so that it cannot stop the SDK from failing the session's
   * in-flight requests.
   *
   * A Streamable-HTTP session has no connection to lose between requests, so a server that
   * restarted is not observed here; the next call reports it, as `'session-expired'` when the
   * server answers HTTP 404 for the stale session id.
   */
  readonly onClose?: () => void;
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
// Failure classification
// ============================================================================

/**
 * Why an MCP operation failed — the detail of the `DetailedResult` returned by
 * {@link connectMcpSession}, {@link listMcpTools}, {@link callMcpTool} and {@link adaptMcpTools}.
 *
 * @remarks
 * Every failure carries exactly one reason: the classification is total, so a consumer can branch
 * on `kind` without parsing the message. It is derived from the SDK's error classes, its JSON-RPC
 * error code, and the HTTP status the transport reported — never from message text.
 *
 * | kind | produced when |
 * |---|---|
 * | `'tool-error'` | The tool ran and returned a result flagged `isError`. The failure message is the tool's own text, unprefixed (see {@link callMcpTool}). |
 * | `'timeout'` | The SDK's request timeout (or `maxTotalTimeoutMs`) elapsed: `McpError` code `-32001`. |
 * | `'aborted'` | The caller's `AbortSignal` fired before the request settled. |
 * | `'not-connected'` | The session's connection is closed: the call was made after it closed, or it closed while the call was in flight (`McpError` code `-32000`). |
 * | `'session-expired'` | A Streamable-HTTP server answered HTTP 404 for an established session: it no longer recognizes the session id (typically after a server restart). |
 * | `'unauthorized'` | The server refused the credentials: HTTP 401 or 403, or the SDK's `UnauthorizedError`. |
 * | `'protocol'` | The server answered with a JSON-RPC error, or the SDK rejected the server's response. `code` is the JSON-RPC error code. |
 * | `'transport'` | Anything else: a network or child-process I/O failure, a non-2xx HTTP status not listed above, or an error the SDK raised without a type. This is the catch-all that makes the classification total. |
 * | `'invalid-handle'` | The session or transport handle did not come from this package. A caller bug; retrying cannot help. |
 *
 * Reconnecting is the consumer's policy. As a guide: `'not-connected'` and `'session-expired'`
 * mean the session is dead; `'transport'` means it is suspect; the others leave it usable.
 *
 * **Two limits of the SDK, stated so nobody builds on more than it gives.** The SDK reports a
 * caller's abort as an `McpError` with the *timeout* code; this package tells the two apart by
 * the identity of the abort it issued, not by the code. And a server that itself answers with the
 * SDK's reserved codes `-32000` or `-32001` is indistinguishable from the SDK raising them, so it
 * is classified the same way.
 *
 * @public
 */
export type McpFailureReason =
  | { readonly kind: 'tool-error' }
  | { readonly kind: 'timeout' }
  | { readonly kind: 'aborted' }
  | { readonly kind: 'not-connected' }
  | { readonly kind: 'session-expired' }
  /** `status` is the HTTP status, when the refusal came as one. */
  | { readonly kind: 'unauthorized'; readonly status?: number }
  /** `code` is the JSON-RPC error code. */
  | { readonly kind: 'protocol'; readonly code: number }
  /** `status` is the HTTP status, when the failure came as one. */
  | { readonly kind: 'transport'; readonly status?: number }
  | { readonly kind: 'invalid-handle' };

// ============================================================================
// Tool discovery + invocation
// ============================================================================

/**
 * Normalized MCP `Tool.annotations` — the five known host-advisory behavior hints.
 *
 * @remarks
 * Field names mirror MCP's `ToolAnnotations` 1:1 (and map straight onto
 * `AiAssist.IAiToolAnnotations`). Per the MCP spec these are hints only, and per the
 * untrusted-server warning they are validated/normalized (known fields kept, malformed
 * or unknown fields dropped) before they reach {@link IMcpToolDescriptor} — the raw
 * server blob is never propagated.
 *
 * @public
 */
export interface IMcpToolAnnotations {
  /** Optional human-readable display title for the tool. */
  readonly title?: string;
  /** Hint: the tool does not modify its environment (read-only). */
  readonly readOnlyHint?: boolean;
  /** Hint: the tool may perform destructive updates (only meaningful when not read-only). */
  readonly destructiveHint?: boolean;
  /** Hint: repeated calls with the same arguments have no additional effect. */
  readonly idempotentHint?: boolean;
  /** Hint: the tool interacts with an open world of external entities. */
  readonly openWorldHint?: boolean;
}

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
  /**
   * The tool's normalized behavior annotations, when the server provided any usable ones.
   * Absent when the server declared no annotations (or only malformed/unknown fields).
   * See {@link IMcpToolAnnotations}.
   */
  readonly annotations?: IMcpToolAnnotations;
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
