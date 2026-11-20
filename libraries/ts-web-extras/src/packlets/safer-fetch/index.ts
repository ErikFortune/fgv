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
 * The browser entry points for `@fgv/ts-extras`'s safer-fetch primitive.
 *
 * The runtime-agnostic core lives in `@fgv/ts-extras` and is shared verbatim: the overall and
 * headers deadlines, the streaming size cap enforced during the read, the content-type gate
 * before the body is touched, the scheme refusal, the structured failure taxonomy, and retry all
 * behave here exactly as they do on Node.
 *
 * **Three guarantees are absent, and the reasons are structural.** There is no resolved-address
 * (private-IP) guard, because no browser API returns a hostname's A/AAAA records and nothing in
 * `fetch` or `Response` exposes the peer address. There is no per-hop revalidation of redirects,
 * because a manual redirect is opaque — no readable `Location`, `status` of `0`. And credential
 * stripping on a cross-origin hop is the platform's doing rather than this code's, since this
 * package never follows a redirect. See the README's guarantee table, which states the whole
 * per-runtime split in one place.
 *
 * This package **states** those gaps rather than degrading quietly around them:
 * `redirectPolicy: 'validate-each-hop'` is refused at option resolution with a message naming
 * the runtime, not accepted and failed at the first redirect. And `addressGuard` stays required,
 * so a browser call site spells `allowAnyAddress()` and a reviewer can grep for it.
 *
 * @packageDocumentation
 */

export {
  browserSaferFetchBytes,
  browserSaferFetchJson,
  browserSaferFetchText,
  type IBrowserSaferFetchJsonOptions,
  type IBrowserSaferFetchOptions
} from './browserSaferFetch';
