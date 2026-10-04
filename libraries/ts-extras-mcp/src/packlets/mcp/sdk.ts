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
 * Minimal projection of the SDK `Client` surface the package depends on.
 * @internal
 */
export interface ISdkClient {
  /**
   * Set by the session layer; the SDK calls it once when the connection closes, for any reason.
   */
  onclose?: () => void;
  connect(transport: ISdkTransport): Promise<void>;
  getServerVersion(): ISdkImplementation | undefined;
  listTools(params?: { cursor?: string }): Promise<ISdkListToolsResult>;
  callTool(params: { name: string; arguments?: Record<string, unknown> }): Promise<ISdkCallToolResult>;
  close(): Promise<void>;
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
 * Which operation a failure came from. An HTTP 404 means "session expired" only once a session
 * exists; during the connect handshake it means the endpoint was not found.
 * @internal
 */
export type SdkFailurePhase = 'connect' | 'session';

/**
 * Classifies an HTTP status reported by an SDK transport error.
 */
function _classifyHttpStatus(status: number | undefined, phase: SdkFailurePhase): McpFailureReason {
  if (status === 401 || status === 403) {
    return { kind: 'unauthorized', status };
  }
  if (status === 404 && phase === 'session') {
    return { kind: 'session-expired' };
  }
  // The SDK uses -1 for "not an HTTP status" (e.g. an unexpected content type).
  return status !== undefined && status >= 100 ? { kind: 'transport', status } : { kind: 'transport' };
}

/**
 * Total classifier from anything the SDK can throw or reject with to a {@link McpFailureReason}.
 * Classifies by error class, JSON-RPC code and HTTP status — never by message text.
 *
 * @remarks
 * Two kinds are not produced here, because they depend on state this function cannot see:
 * `'aborted'` is decided by the caller from the identity of the abort reason it issued (the SDK
 * reports an abort with the *timeout* code), and `'not-connected'` for the SDK's untyped
 * "Not connected" error is decided from the session's observed close.
 *
 * @param error - The thrown or rejected value.
 * @param phase - Whether a session had been established when the failure occurred.
 * @internal
 */
export function classifySdkError(error: unknown, phase: SdkFailurePhase): McpFailureReason {
  if (error instanceof McpError) {
    if (error.code === ErrorCode.RequestTimeout) {
      return { kind: 'timeout' };
    }
    if (error.code === ErrorCode.ConnectionClosed) {
      return { kind: 'not-connected' };
    }
    return { kind: 'protocol', code: error.code };
  }
  if (error instanceof UnauthorizedError) {
    return { kind: 'unauthorized' };
  }
  if (error instanceof StreamableHTTPError || error instanceof SseError) {
    return _classifyHttpStatus(error.code, phase);
  }
  return { kind: 'transport' };
}
