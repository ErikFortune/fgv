[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / McpFailureReason

# Type Alias: McpFailureReason

> **McpFailureReason** = \{ `kind`: `"tool-error"`; \} \| \{ `kind`: `"timeout"`; \} \| \{ `kind`: `"aborted"`; \} \| \{ `kind`: `"not-connected"`; \} \| \{ `kind`: `"session-expired"`; \} \| \{ `kind`: `"unauthorized"`; `resourceMetadataUrl?`: `string`; `status?`: `number`; \} \| \{ `kind`: `"egress-blocked"`; `reason`: [`SaferFetch.FetchFailureKind`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs); \} \| \{ `code?`: `number`; `kind`: `"protocol"`; \} \| \{ `kind`: `"transport"`; `status?`: `number`; \} \| \{ `kind`: `"invalid-handle"`; \} \| \{ `kind`: `"invalid-options"`; \} \| \{ `kind`: `"limit-exceeded"`; `limit`: [`McpListingLimit`](McpListingLimit.md); \}

Why an MCP operation failed — the detail of the `DetailedResult` returned by
[connectMcpSession](../functions/connectMcpSession.md), [listMcpTools](../functions/listMcpTools.md), [callMcpTool](../functions/callMcpTool.md) and [adaptMcpTools](../functions/adaptMcpTools.md).

## Union Members

### Type Literal

\{ `kind`: `"tool-error"`; \}

***

### Type Literal

\{ `kind`: `"timeout"`; \}

***

### Type Literal

\{ `kind`: `"aborted"`; \}

***

### Type Literal

\{ `kind`: `"not-connected"`; \}

***

### Type Literal

\{ `kind`: `"session-expired"`; \}

***

### Type Literal

\{ `kind`: `"unauthorized"`; `resourceMetadataUrl?`: `string`; `status?`: `number`; \}

`status` is the HTTP status, when the refusal came as one. `resourceMetadataUrl` is the
`resource_metadata` URL from the endpoint's most recent `WWW-Authenticate` challenge, present
only when it was a valid `http:`/`https:` URL on one printable line. It is chosen by the server
and may come from an earlier challenge than the one that failed this operation: fetch it only
through the same guarded `fetch` as the transport.

***

### Type Literal

\{ `kind`: `"egress-blocked"`; `reason`: [`SaferFetch.FetchFailureKind`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs); \}

`reason` is the kind of the guarded fetch's `FetchFailureReason`; its URL-bearing payload is never carried.

***

### Type Literal

\{ `code?`: `number`; `kind`: `"protocol"`; \}

`code` is the JSON-RPC error code, when the failure carried one.

***

### Type Literal

\{ `kind`: `"transport"`; `status?`: `number`; \}

`status` is the HTTP status, when the failure came as one.

***

### Type Literal

\{ `kind`: `"invalid-handle"`; \}

***

### Type Literal

\{ `kind`: `"invalid-options"`; \}

***

### Type Literal

\{ `kind`: `"limit-exceeded"`; `limit`: [`McpListingLimit`](McpListingLimit.md); \}

`limit` names the listing bound that was exceeded.

## Remarks

Every failure carries exactly one reason: the classification is total, so a consumer can branch
on `kind` without parsing the message. It is derived from the SDK's error classes, its JSON-RPC
error code, and the HTTP status the transport reported — never from message text.

| kind | produced when |
|---|---|
| `'tool-error'` | The tool ran and returned a result flagged `isError`. The failure message is the tool's own text, unprefixed (see [callMcpTool](../functions/callMcpTool.md)). |
| `'timeout'` | The SDK's request timeout (or `maxTotalTimeoutMs`) elapsed: `McpError` code `-32001`. Also a guarded `fetch`'s headers deadline (`headersTimeoutMs`) — see [IMcpHttpTransportParams.fetch](../interfaces/IMcpHttpTransportParams.md#property-fetch). |
| `'aborted'` | The caller's `AbortSignal` fired before the request settled. |
| `'not-connected'` | The session's connection is closed: the call was made after it closed, or it closed while the call was in flight. Decided by the observed close, which the SDK reports before it fails the in-flight requests. During the connect handshake, **any** `-32000` is `'not-connected'` — whether the SDK raised it or the server sent it — because a failed handshake leaves no session either way. |
| `'session-expired'` | A Streamable-HTTP server answered HTTP 404 for an established session: it no longer recognizes the session id (typically after a server restart). |
| `'unauthorized'` | The server refused the credentials: HTTP 401 or 403, or the SDK's `UnauthorizedError` — including an interactive authorization refused outside the connect (see [IMcpHttpTransportParams.authProvider](../interfaces/IMcpHttpTransportParams.md#property-authprovider)) — or an OAuth error from the authorization server. `resourceMetadataUrl` is the `resource_metadata` URL of the endpoint's most recent `WWW-Authenticate` challenge, when it sent a valid one. |
| `'egress-blocked'` | The transport's guarded `fetch` refused the request (`SaferFetch.GuardedFetchError`): an address or request guard, a rejected redirect, a refused response head or an unsupported request. `reason` is the refusal's `FetchFailureReason` kind, never its URL-bearing detail. A configuration refusal: retrying cannot help. A guarded fetch's `'timeout'` (its headers deadline) is `'timeout'`; its `'network'`, `'aborted'` and `'unknown'` (an internal failure) are not refusals and classify as a plain `fetch` failure would (`'transport'`, or `'not-connected'` once closed). |
| `'protocol'` | The server answered with a JSON-RPC error (`code` is its code — including `-32000` on a session that is still open, which servers use as a generic error), or the SDK rejected a response that failed its result schema (no `code`). |
| `'transport'` | Anything else: a network or child-process I/O failure, a non-2xx HTTP status not listed above, or an error the SDK raised without a type — including the handshake's protocol-version refusal, which the SDK raises as a plain `Error`. This is the catch-all that makes the classification total. |
| `'invalid-handle'` | The session or transport handle did not come from this package, or the transport handle was already used by an earlier connect. A caller bug; retrying cannot help. |
| `'invalid-options'` | A `timeoutMs` / `maxTotalTimeoutMs` / `maxTotalMs` outside the accepted range, or a `maxPages` that is not a positive integer. Reported before anything is sent. |
| `'limit-exceeded'` | A bound the caller set over a paged listing was exceeded: [IListMcpToolsOptions.maxPages](../interfaces/IListMcpToolsOptions.md#property-maxpages) or [IListMcpToolsOptions.maxTotalMs](../interfaces/IListMcpToolsOptions.md#property-maxtotalms), named by `limit`. The listing fails whole; nothing is truncated. The session stays usable. |

**HTTP-error and OAuth-error text never reaches a failure message.** A failure from an HTTP
error (a response's body or status text) or an OAuth error (an `error_description`), and every
`'unauthorized'` failure, gets the kind and the HTTP status as its text — e.g.
`unauthorized (HTTP 401)`, `transport (HTTP 500)` — because a server may repeat a credential it
was sent. Other messages can carry server text: `'tool-error'` and `'protocol'` messages carry the
server's own text by design, and the SDK's other auth errors (for example a failed metadata
discovery) can name a server-chosen URL.

Reconnecting is the consumer's policy. As a guide: `'not-connected'` and `'session-expired'`
mean the session is dead; `'transport'` means it is suspect; `'egress-blocked'` means the
configuration refuses this server or request, so reconnecting cannot help; the others leave it
usable.

**Two limits of the SDK, stated so nobody builds on more than it gives.** The SDK reports a
caller's abort as an `McpError` with the *timeout* code; this package tells the two apart by
the identity of the abort it issued, not by the code. And a server that itself answers with the
SDK's reserved timeout code `-32001` is indistinguishable from the SDK's own timeout, so it is
classified `'timeout'`. (The SDK's other reserved code, `-32000`, is disambiguated by the
session's observed close.)
