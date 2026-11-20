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
 * Public aliases of SDK types. A type-only leaf: see `sdk.ts` for why it is not part of that module.
 * @packageDocumentation
 */

import { type OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';

/**
 * The MCP SDK's OAuth client provider — the object that holds a client's registration and tokens
 * and starts the interactive authorization — under this package's name.
 *
 * @remarks
 * This is the SDK's own `OAuthClientProvider` interface from
 * `@modelcontextprotocol/sdk/client/auth.js`, unchanged: implement it (over your own keystore, for
 * example) and pass it as {@link IMcpHttpTransportParams.authProvider}. The package wraps it before
 * handing it to the SDK, so that the interactive steps — `state`, `saveCodeVerifier` and
 * `redirectToAuthorization` — run only inside {@link connectMcpSession}.
 * @public
 */
export type McpOAuthClientProvider = OAuthClientProvider;
