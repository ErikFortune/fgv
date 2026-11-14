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

import { failWithDetail, type Converter, type DetailedResult, type Validator } from '@fgv/ts-utils';
import type { JsonValue } from '@fgv/ts-json-base';
import { SaferFetch } from '@fgv/ts-extras';

/**
 * Options for the browser entry points.
 *
 * @remarks
 * The same options the Node entry points take, including the **required** `addressGuard`. It
 * stays required here rather than being wired to `allowAnyAddress()` internally, because the
 * requirement is the primitive's strongest honesty mechanism: a browser call site that reads
 * `addressGuard: allowAnyAddress()` says out loud that no SSRF guarantee is in force, and a
 * reviewer greps one identifier to find every such site. Silently supplying the guard would make
 * a browser call look protected.
 *
 * `allowAnyAddress()` is the correct choice in a browser almost always. A caller who wants a
 * genuine URL-zero restriction can write a guard that checks scheme, host and port on the URL it
 * is handed — `classifyAddress` is exported from `@fgv/ts-extras/safer-fetch` for the IP-literal
 * case — but no browser guard can resolve a hostname, so none of them closes the gap this
 * package documents.
 * @public
 */
export type IBrowserSaferFetchOptions = SaferFetch.ISaferFetchOptions;

/**
 * Options for the validating form of `browserSaferFetchJson`.
 * @public
 */
export interface IBrowserSaferFetchJsonOptions<T> extends IBrowserSaferFetchOptions {
  /** Applied to the parsed JSON, taking the caller from wire to validated `T` in one step. */
  readonly converter: Converter<T> | Validator<T>;
}

/**
 * Refuses, up front, an option this runtime cannot honor.
 *
 * @remarks
 * `'validate-each-hop'` is accepted by the shared type because one core serves both runtimes;
 * the runtime is not shared. A browser's `redirect: 'manual'` yields an opaque response —
 * `type` is `'opaqueredirect'`, `status` is `0`, and `Location` is not readable — so the mode
 * cannot do the one thing it names, and the core would fail at the first redirect as
 * `'redirect-opaque'`.
 *
 * That late failure is honest but says the wrong thing: it reports the symptom (the platform
 * would not show us the hop) at the first redirect, rather than the cause (this runtime cannot
 * revalidate hops at all) at the call. A caller whose URLs happen not to redirect would never
 * see it, and would ship believing per-hop revalidation was in force. Failing at option
 * resolution names the runtime and fails every time, redirect or not.
 */
function _refuseUnsupported<T>(
  options: IBrowserSaferFetchOptions
): DetailedResult<T, SaferFetch.FetchFailureReason> | undefined {
  if (options.redirectPolicy === 'validate-each-hop') {
    const detail =
      "redirectPolicy 'validate-each-hop' cannot be honored in a browser: a browser's manual " +
      'redirect yields an opaque response with no readable Location, so there is no hop to ' +
      "revalidate. Use 'reject', or call this from Node.";
    // `'unknown'` is the taxonomy's slot for invalid options, matching how the core reports a
    // `redirectPolicy` it does not implement.
    return failWithDetail<T, SaferFetch.FetchFailureReason>(detail, { kind: 'unknown', detail });
  }
  return undefined;
}

/**
 * Fetches a URL in a browser and returns the raw response bytes.
 *
 * @remarks
 * The runtime-agnostic half of `@fgv/ts-extras`'s safer-fetch primitive, wired for the browser
 * and refusing the options the browser cannot honor. The deadlines, the streaming size cap, the
 * content-type gate, the scheme refusal, the failure taxonomy and retry all behave exactly as
 * they do on Node.
 *
 * **What this does not protect against — the three gaps are structural, not unimplemented.**
 *
 * - **No resolved-address (private-IP) guard.** No browser API returns a hostname's A/AAAA
 *   records and nothing in `fetch` or `Response` exposes the peer address, so the SSRF check at
 *   the heart of the Node guard has no inputs here. `allowAnyAddress()` is the honest posture
 *   and its name says so.
 * - **No per-hop revalidation of redirects.** A manual redirect is opaque in a browser, so the
 *   hop cannot be inspected, guarded, or followed. `'validate-each-hop'` is refused up front
 *   rather than degraded; `'reject'` — the default — is fully enforced.
 * - **Credential stripping is the platform's.** Browsers strip credential headers on a
 *   cross-origin redirect themselves. Since this package never follows a redirect, the
 *   `sensitiveHeaders` machinery in the core never runs here; the guarantee holds, but it is not
 *   this code keeping it.
 *
 * The browser's real controls are CORS and network position, and they are not nothing: a fetch
 * to `169.254.169.254` from a public origin is already constrained in a way a server-side fetch
 * is not. They are simply different controls from the ones the Node guard offers.
 *
 * **The failure detail is an information-disclosure surface.** Log it; do not echo it, or any
 * string derived from it, to an untrusted caller.
 *
 * @param url - The URL to fetch. Only `http:` and `https:` are ever requested.
 * @param options - Call options. `addressGuard` is required and has no default — use
 * `allowAnyAddress()` to name the absence of the guarantee at the call site.
 * @public
 */
export async function browserSaferFetchBytes(
  url: string | URL,
  options: IBrowserSaferFetchOptions
): Promise<DetailedResult<SaferFetch.ISaferFetchResponse<Uint8Array>, SaferFetch.FetchFailureReason>> {
  const refused = _refuseUnsupported<SaferFetch.ISaferFetchResponse<Uint8Array>>(options);
  if (refused !== undefined) {
    return refused;
  }
  return SaferFetch.saferFetchBytes(url, options);
}

/**
 * Fetches a URL in a browser and decodes the response body as text.
 *
 * @remarks
 * See `browserSaferFetchBytes` for the three guarantees this runtime cannot offer and for
 * the warning about echoing failure detail to untrusted callers.
 *
 * @param url - The URL to fetch.
 * @param options - Call options. `addressGuard` is required.
 * @public
 */
export async function browserSaferFetchText(
  url: string | URL,
  options: IBrowserSaferFetchOptions
): Promise<DetailedResult<SaferFetch.ISaferFetchResponse<string>, SaferFetch.FetchFailureReason>> {
  const refused = _refuseUnsupported<SaferFetch.ISaferFetchResponse<string>>(options);
  if (refused !== undefined) {
    return refused;
  }
  return SaferFetch.saferFetchText(url, options);
}

/**
 * Fetches a URL in a browser and parses the response body as JSON, yielding the raw `JsonValue`.
 *
 * @remarks
 * See `browserSaferFetchBytes` for the three guarantees this runtime cannot offer.
 *
 * @param url - The URL to fetch.
 * @param options - Call options. `addressGuard` is required.
 * @public
 */
export async function browserSaferFetchJson(
  url: string | URL,
  options: IBrowserSaferFetchOptions
): Promise<DetailedResult<SaferFetch.ISaferFetchResponse<JsonValue>, SaferFetch.FetchFailureReason>>;
/**
 * Fetches a URL in a browser, parses the response body as JSON, and runs it through the supplied
 * converter or validator so the caller reaches a validated `T` in one step.
 *
 * @remarks
 * `T` is inferred from `converter` and is never caller-asserted, so the returned type is
 * evidenced at runtime rather than claimed.
 *
 * See `browserSaferFetchBytes` for the three guarantees this runtime cannot offer.
 *
 * @param url - The URL to fetch.
 * @param options - Call options plus the required `converter`. `addressGuard` is required.
 * @public
 */
export async function browserSaferFetchJson<T>(
  url: string | URL,
  options: IBrowserSaferFetchJsonOptions<T>
): Promise<DetailedResult<SaferFetch.ISaferFetchResponse<T>, SaferFetch.FetchFailureReason>>;
export async function browserSaferFetchJson<T>(
  url: string | URL,
  options: IBrowserSaferFetchOptions | IBrowserSaferFetchJsonOptions<T>
): Promise<DetailedResult<SaferFetch.ISaferFetchResponse<T | JsonValue>, SaferFetch.FetchFailureReason>> {
  const refused = _refuseUnsupported<SaferFetch.ISaferFetchResponse<T | JsonValue>>(options);
  if (refused !== undefined) {
    return refused;
  }
  // Narrowed by the same `converter`-presence test the core's overload implementation uses, so
  // the two forms dispatch identically rather than by re-deriving the rule here.
  const converter = (options as Partial<IBrowserSaferFetchJsonOptions<T>>).converter ?? undefined;
  return converter !== undefined
    ? SaferFetch.saferFetchJson<T>(url, { ...options, converter })
    : SaferFetch.saferFetchJson(url, options);
}
