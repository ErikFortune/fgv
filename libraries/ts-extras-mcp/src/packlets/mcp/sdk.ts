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
 * **The single `@modelcontextprotocol/sdk` import site for the entire package.**
 *
 * Every other module in `@fgv/ts-extras-mcp` depends only on the minimal local projection
 * exported here (`ISdkClient`, `ISdkTransport`, the three `make*` factories) — never on the SDK
 * directly. This keeps the announced v2 client-package rename a one-file change and lets unit
 * tests mock this module instead of the SDK internals (no live server required).
 *
 * The only `as unknown as` casts in the package live here, at the boundary where the real SDK
 * objects are narrowed to the local projection.
 *
 * @internal
 */

import { UnauthorizedError } from '@modelcontextprotocol/sdk/client/auth.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SseError } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  StreamableHTTPClientTransport,
  StreamableHTTPError
} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { DEFAULT_REQUEST_TIMEOUT_MSEC } from '@modelcontextprotocol/sdk/shared/protocol.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

import { type McpFailureReason } from './model';

/**
 * Opaque transport handle. The concrete value is an SDK `Transport`; consumers of this module
 * treat it as opaque and only ever hand it back to {@link makeClient}-produced clients.
 * @internal
 */
export type ISdkTransport = object;

/**
 * A single content block in an MCP `CallToolResult`. Only `text` blocks carry inline content;
 * all other block types are projected to a structural summary by the operations layer.
 * @internal
 */
export interface ISdkContentBlock {
  readonly type: string;
  readonly text?: string;
}

/**
 * Projection of the SDK's `CallToolResult`.
 * @internal
 */
export interface ISdkCallToolResult {
  readonly content?: ReadonlyArray<ISdkContentBlock>;
  readonly isError?: boolean;
}

/**
 * Projection of a single tool descriptor in the SDK's `ListToolsResult`.
 * @internal
 */
export interface ISdkToolDescriptor {
  readonly name: string;
  readonly description?: string;
  readonly inputSchema?: unknown;
  /**
   * Raw MCP `Tool.annotations` (untrusted). Declared as `unknown` so the SDK field survives
   * narrowing; the operations layer validates/normalizes it (never propagates raw) per the MCP
   * spec's untrusted-server warning.
   */
  readonly annotations?: unknown;
}

/**
 * Projection of the SDK's `ListToolsResult` (one page).
 * @internal
 */
export interface ISdkListToolsResult {
  readonly tools: ReadonlyArray<ISdkToolDescriptor>;
  readonly nextCursor?: string;
}

/**
 * Server identity returned by the SDK's `getServerVersion()` after the initialize handshake.
 * @internal
 */
export interface ISdkImplementation {
  readonly name: string;
  readonly version: string;
}

/**
 * Projection of the SDK's `Progress` notification payload.
 * @internal
 */
export interface ISdkProgress {
  readonly progress: number;
  readonly total?: number;
  readonly message?: string;
}

/**
 * Projection of the SDK's per-request `RequestOptions`.
 * @internal
 */
export interface ISdkRequestOptions {
  readonly timeout?: number;
  readonly signal?: AbortSignal;
  readonly onprogress?: (progress: ISdkProgress) => void;
  readonly resetTimeoutOnProgress?: boolean;
  readonly maxTotalTimeout?: number;
}

/**
 * Minimal projection of the SDK `Client` surface the package depends on.
 * @internal
 */
export interface ISdkClient {
  /**
   * Set by the session layer; the SDK calls it once when the connection closes, for any reason.
   */
  onclose?: () => void;
  connect(transport: ISdkTransport, options?: ISdkRequestOptions): Promise<void>;
  getServerVersion(): ISdkImplementation | undefined;
  listTools(params?: { cursor?: string }, options?: ISdkRequestOptions): Promise<ISdkListToolsResult>;
  /** The second parameter is the SDK's result schema; `undefined` selects its default. */
  callTool(
    params: { name: string; arguments?: Record<string, unknown> },
    resultSchema?: undefined,
    options?: ISdkRequestOptions
  ): Promise<ISdkCallToolResult>;
  close(): Promise<void>;
}

/**
 * Creates the reason a request is aborted with. Each call gets a distinct object, which the SDK
 * rejects the request with *by identity*: it passes an `McpError` reason through unchanged, but
 * wraps any other reason in a new `McpError` with the timeout code — which is why a plain
 * `AbortSignal` reason would make an abort indistinguishable from a timeout. The code is the one
 * the SDK itself uses for an abort; it is never what classifies the failure.
 * @internal
 */
export function makeAbortReason(): Error {
  return new McpError(ErrorCode.RequestTimeout, 'request aborted by the caller');
}

/**
 * The SDK's default per-request timeout, in milliseconds.
 * @internal
 */
export const SDK_DEFAULT_TIMEOUT_MS: number = DEFAULT_REQUEST_TIMEOUT_MSEC;

/**
 * Creates the error a timeout this package enforces itself rejects with — the same class and
 * code the SDK uses for its own request timeouts, so it classifies identically.
 * @internal
 */
export function makeTimeoutError(timeoutMs: number): Error {
  return McpError.fromError(ErrorCode.RequestTimeout, 'Request timed out', { timeout: timeoutMs });
}

/**
 * Parameters for the stdio transport factory.
 * @internal
 */
export interface ISdkStdioParams {
  readonly command: string;
  readonly args?: ReadonlyArray<string>;
  readonly env?: Record<string, string>;
  readonly cwd?: string;
}

/**
 * Constructs an MCP client. The `as unknown as` cast is the package's single SDK-type
 * bridge — the runtime object is a real SDK `Client`.
 * @internal
 */
export function makeClient(name: string, version: string): ISdkClient {
  return new Client({ name, version }, { capabilities: {} }) as unknown as ISdkClient;
}

/**
 * Constructs a stdio transport that spawns the given command as a subprocess.
 * @internal
 */
export function makeStdioTransport(params: ISdkStdioParams): ISdkTransport {
  return new StdioClientTransport({
    command: params.command,
    args: params.args ? [...params.args] : undefined,
    env: params.env,
    cwd: params.cwd
  }) as unknown as ISdkTransport;
}

/**
 * Constructs a Streamable-HTTP transport for the given URL, with optional static headers.
 * @internal
 */
export function makeHttpTransport(url: URL, headers?: Record<string, string>): ISdkTransport {
  return new StreamableHTTPClientTransport(url, {
    requestInit: headers ? { headers } : undefined
  }) as unknown as ISdkTransport;
}

/**
 * What the classifier needs to know about where a failure came from.
 *
 * @remarks
 * During the connect handshake there is no session yet, and a failed handshake is always torn down
 * (by the SDK, or by `connectMcpSession` where the SDK does not — a rejected `transport.start()`),
 * so the close state carries no information there and is not asked for. On an
 * established session, `closed` is whether its close had been observed when the failure was
 * classified; the SDK calls `onclose` before it fails the requests in flight, so it is already
 * `true` for every failure the close itself caused.
 * @internal
 */
export type SdkFailureContext =
  | { readonly phase: 'connect' }
  | { readonly phase: 'session'; readonly closed: boolean };

/**
 * Classifies an HTTP status reported by an SDK transport error.
 */
function _classifyHttpStatus(status: number | undefined, context: SdkFailureContext): McpFailureReason {
  if (status === 401 || status === 403) {
    return { kind: 'unauthorized', status };
  }
  if (status === 404 && context.phase === 'session') {
    return { kind: 'session-expired' };
  }
  // The SDK uses -1 for "not an HTTP status" (e.g. an unexpected content type).
  return status !== undefined && status >= 100 ? { kind: 'transport', status } : { kind: 'transport' };
}

/**
 * Class names of the error the SDK rejects with when a response fails its result schema: zod's
 * error, which is `'$ZodError'` from zod 4's core (what SDK 1.29 uses with zod 4) and `'ZodError'`
 * from zod 3 or zod 4 classic. The SDK accepts either major (`^3.25 || ^4.0`).
 */
const SCHEMA_REJECTION_NAMES: ReadonlySet<string> = new Set(['$ZodError', 'ZodError']);

/**
 * Whether a value is the error the SDK raises when a response fails its result schema. The SDK
 * rejects with the schema library's own error, not an `McpError`; it is recognized by its class
 * name, which the schema library sets (never by message text). The schema library is the SDK's
 * dependency, not this package's, so an `instanceof` against it is not available here.
 */
function _isSchemaRejection(error: unknown): boolean {
  return error instanceof Error && SCHEMA_REJECTION_NAMES.has(error.name);
}

/**
 * Total classifier from anything the SDK can throw or reject with to a {@link McpFailureReason}.
 * Classifies by error class, JSON-RPC code, HTTP status and the session's observed close — never
 * by message text.
 *
 * @remarks
 * `'aborted'` is not produced here: the caller decides it from the identity of the abort reason it
 * issued, because the SDK reports an abort with the *timeout* code.
 *
 * On an established session `'not-connected'` is decided by the observed close, not by code
 * alone. JSON-RPC reserves `-32000`..`-32099` for implementation-defined server errors and many
 * servers answer `-32000` as a generic error, so a `-32000` on a session that is still open is the
 * server's `protocol` error, not a dead connection. The SDK's own `ConnectionClosed` (`-32000`) and
 * its untyped "Not connected" are both raised only after `onclose` has fired. During the
 * handshake, where a failure leaves no session either way, `-32000` is `'not-connected'`.
 *
 * @param error - The thrown or rejected value.
 * @param context - Where the failure came from (see {@link SdkFailureContext}).
 * @internal
 */
export function classifySdkError(error: unknown, context: SdkFailureContext): McpFailureReason {
  if (error instanceof McpError) {
    if (error.code === ErrorCode.RequestTimeout) {
      return { kind: 'timeout' };
    }
    if (error.code === ErrorCode.ConnectionClosed && (context.phase === 'connect' || context.closed)) {
      return { kind: 'not-connected' };
    }
    return { kind: 'protocol', code: error.code };
  }
  if (_isSchemaRejection(error)) {
    return { kind: 'protocol' };
  }
  if (error instanceof UnauthorizedError) {
    return { kind: 'unauthorized' };
  }
  if (error instanceof StreamableHTTPError || error instanceof SseError) {
    return _classifyHttpStatus(error.code, context);
  }
  return context.phase === 'session' && context.closed ? { kind: 'not-connected' } : { kind: 'transport' };
}
