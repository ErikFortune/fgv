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
 * `@fgv/ts-extras-mcp` — a Result-integration boundary over `@modelcontextprotocol/sdk` that
 * connects to MCP (Model Context Protocol) servers, discovers their tools, and adapts each into
 * an `AiAssist.IAiClientTool` so it drops directly into `AiAssist.executeClientToolTurn` —
 * making any MCP server's tools callable across all four cloud providers with no per-provider work.
 *
 * Mirrors the discipline of `@fgv/ts-extras-webauthn` / `@fgv/ts-extras-transformers`: thin
 * `Result<T>` conversion over a well-maintained upstream SDK, with no opinionated orchestration
 * above the boundary.
 *
 * **In scope (slice 1, Node):** transport factories (`createStdioTransport`,
 * `createHttpTransport`), session lifecycle (`connectMcpSession`, `closeMcpSession`), tool
 * discovery + invocation (`listMcpTools`, `callMcpTool`), and the headline adapter
 * (`adaptMcpTools`) which gracefully degrades on tools whose `inputSchema` is outside the
 * supported JSON Schema subset (surfacing them on `skipped` and warning NOISILY).
 *
 * **Explicitly NOT in scope (deferred — see README / docs/FUTURE.md):**
 * - Browser sibling `@fgv/ts-web-extras-mcp`
 * - MCP resources / prompts / sampling features
 * - OAuth / managed auth (static headers only at v0.1)
 * - Multimodal tool-result passthrough (text-block projection only)
 * - Cross-server tool-name namespacing (duplicate names already fail loudly in
 *   `executeClientToolTurn`)
 *
 * @packageDocumentation
 */

export * from './packlets/mcp';
