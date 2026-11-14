[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / FetchFailureReason

# Type Alias: FetchFailureReason

> **FetchFailureReason** = \{ `detail`: `string`; `kind`: `"invalid-url"`; `url`: `string`; \} \| \{ `detail`: `string`; `guard`: `string`; `hop`: `number`; `kind`: `"blocked-by-guard"`; `url`: `string`; \} \| \{ `kind`: `"redirect-rejected"`; `status`: `number`; `url`: `string`; \} \| \{ `kind`: `"redirect-opaque"`; \} \| \{ `hops`: `number`; `kind`: `"too-many-redirects"`; `limit`: `number`; \} \| \{ `elapsedMs`: `number`; `kind`: `"timeout"`; `limitMs`: `number`; `phase`: [`FetchTimeoutPhase`](FetchTimeoutPhase.md); \} \| \{ `kind`: `"aborted"`; \} \| \{ `detail`: `string`; `kind`: `"network"`; \} \| \{ `bodyPreview?`: `string`; `kind`: `"http-status"`; `status`: `number`; `statusText`: `string`; \} \| \{ `bytesRead`: `number`; `declared?`: `number`; `kind`: `"too-large"`; `limit`: `number`; \} \| \{ `accepted`: `ReadonlyArray`\<`string`\>; `contentType?`: `string`; `kind`: `"unsupported-content-type"`; \} \| \{ `detail`: `string`; `kind`: `"decode"`; \} \| \{ `detail`: `string`; `kind`: `"parse"`; \} \| \{ `detail`: `string`; `kind`: `"unknown"`; \}

Machine-readable reason a safer-fetch call failed, carried as the detail of the
`DetailedResult` every entry point returns.

## Union Members

### Type Literal

\{ `detail`: `string`; `kind`: `"invalid-url"`; `url`: `string`; \}

The supplied URL could not be parsed, or its scheme is not `http:` or `https:`.

***

### Type Literal

\{ `detail`: `string`; `guard`: `string`; `hop`: `number`; `kind`: `"blocked-by-guard"`; `url`: `string`; \}

A guard refused. `hop` is 0-based; hop 0 is the caller's URL, and `guard` names which
guard rejected — which is what makes "did the address check run, and was it the thing that
said no?" answerable from the failure alone. A content-type rejection is reported as
`'unsupported-content-type'` instead, because that case carries a more useful payload.

***

### Type Literal

\{ `kind`: `"redirect-rejected"`; `status`: `number`; `url`: `string`; \}

A redirect status was received that this call would not follow: the policy is `'reject'`,
or the response carried no usable `Location`, or following it would revisit a URL already
in the chain.

The three are deliberately one kind. Splitting them would buy a caller almost nothing and
would widen the scanning oracle this taxonomy already is — and the two follow-time cases
are facts about the chain the redirecting server produced, not about the network behind
this process. "The chain got too long" is a different question and stays
`'too-many-redirects'`.

`url` is always the URL that **issued** the rejected redirect — the hop this call actually
requested and got a 3xx back from — never the `Location` target it pointed at. That holds
for all three cases, including the revisit case, where the target is the URL already in the
chain and naming it here would make the same field mean two different things. The target is
named in the message instead. `status` is the redirect status that was received.

***

### Type Literal

\{ `kind`: `"redirect-opaque"`; \}

The platform returned an opaque redirect, whose `Location` is not readable. This is
what a browser yields for `redirect: 'manual'`; the hop cannot be inspected at all.

***

### Type Literal

\{ `hops`: `number`; `kind`: `"too-many-redirects"`; `limit`: `number`; \}

The redirect hop budget was exhausted.

***

### Type Literal

\{ `elapsedMs`: `number`; `kind`: `"timeout"`; `limitMs`: `number`; `phase`: [`FetchTimeoutPhase`](FetchTimeoutPhase.md); \}

One of the deadlines elapsed. Distinct from `'aborted'`, which is the caller's signal.

***

### Type Literal

\{ `kind`: `"aborted"`; \}

The caller's `AbortSignal` fired. Distinct from `'timeout'`, which is our deadline.

***

### Type Literal

\{ `detail`: `string`; `kind`: `"network"`; \}

The transport could not complete the request.

***

### Type Literal

\{ `bodyPreview?`: `string`; `kind`: `"http-status"`; `status`: `number`; `statusText`: `string`; \}

A non-2xx response. `bodyPreview` is **never populated in this release** — error bodies
routinely echo request content, including credentials, so surfacing one has to be an
explicit, length-capped opt-in rather than a default. The field is declared so that adding
that opt-in later is additive.

***

### Type Literal

\{ `bytesRead`: `number`; `declared?`: `number`; `kind`: `"too-large"`; `limit`: `number`; \}

The response exceeded the byte cap. `declared` is what `Content-Length` claimed, present
only when the header was sent — and it counts *encoded* bytes where `bytesRead` counts
*decoded* bytes, so a `declared` far below `bytesRead` is evidence of a compression bomb
or a lying server rather than an arithmetic error.

***

### Type Literal

\{ `accepted`: `ReadonlyArray`\<`string`\>; `contentType?`: `string`; `kind`: `"unsupported-content-type"`; \}

A response-headers guard rejected the response's content type.

***

### Type Literal

\{ `detail`: `string`; `kind`: `"decode"`; \}

The response bytes could not be decoded to text with the indicated charset.

***

### Type Literal

\{ `detail`: `string`; `kind`: `"parse"`; \}

The decoded text could not be parsed, or failed the caller's converter.

***

### Type Literal

\{ `detail`: `string`; `kind`: `"unknown"`; \}

Anything else — including invalid options and a guard or transport that violated its
contract. Reports what it knows rather than guessing at a more specific kind.

## Remarks

**This value is an internal-network scanning oracle. Do not echo it, or any string
derived from it, to an untrusted caller.** A `'blocked-by-guard'` detail names the
URL, the hop, and the guard that rejected it; an attacker who can influence the
request URL and observe the error learns whether an internal host exists. Log the
detail; return a coarse code (the `kind` alone, or a generic message) to callers.

Following the `AiAssist.JsonParseFailureReason` precedent in this package: a `kind`
discriminant with per-kind payload fields, and `'unknown'` as an honest catch-all
rather than a guess.
