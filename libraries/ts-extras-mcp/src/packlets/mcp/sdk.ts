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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

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
