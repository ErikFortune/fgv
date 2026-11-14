[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IListMcpToolsOptions

# Interface: IListMcpToolsOptions

Options for [listMcpTools](../functions/listMcpTools.md): the per-request options, applied to each page, plus bounds over
the whole paged listing.

## Remarks

Neither bound has a default: without them a server can page without end, or slowly, for as long
as it likes. Exceeding either fails the whole listing with the `'limit-exceeded'`
[McpFailureReason](../type-aliases/McpFailureReason.md), naming the bound in `limit`; the pages already read are discarded, never
returned as a truncated catalog.

## Extends

- [`IMcpRequestOptions`](IMcpRequestOptions.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-maxpages"></a> `maxPages?` | `readonly` | `number` | The most pages the listing may read. A listing whose page number `maxPages` still carries a `nextCursor` fails without requesting another page; a catalog of exactly `maxPages` pages succeeds. Must be a positive integer; anything else fails with `'invalid-options'` before a request is sent. |
| <a id="property-maxtotalms"></a> `maxTotalMs?` | `readonly` | `number` | An overall deadline, in milliseconds, over the whole paged listing, measured from the call. It is checked before each page is requested, and a page in flight when it elapses is aborted (the SDK sends the server a `notifications/cancelled` for it). A page that settled before the deadline fired is kept. It runs alongside each page's own `timeoutMs`, whichever fires first. The same range as `timeoutMs` applies. |
| <a id="property-maxtotaltimeoutms"></a> `maxTotalTimeoutMs?` | `readonly` | `number` | An overall limit, in milliseconds, that progress cannot extend. The SDK checks it when a progress notification arrives, so it only has effect together with `resetTimeoutOnProgress`. The same range as `timeoutMs` applies. |
| <a id="property-onprogress"></a> `onProgress?` | `readonly` | (`progress`) => `void` | Receives the server's progress notifications for this request. Supplying it is what asks the server for progress (the SDK attaches a progress token only when a callback is given). |
| <a id="property-resettimeoutonprogress"></a> `resetTimeoutOnProgress?` | `readonly` | `boolean` | When `true`, each progress notification restarts the `timeoutMs` clock. Default `false`. |
| <a id="property-signal"></a> `signal?` | `readonly` | `AbortSignal` | Aborts the request. A request aborted before it settles fails with the `'aborted'` [McpFailureReason](../type-aliases/McpFailureReason.md), never `'timeout'` or `'transport'`; a signal already aborted when the call is made fails the same way without sending anything. |
| <a id="property-timeoutms"></a> `timeoutMs?` | `readonly` | `number` | Request timeout in milliseconds. When it elapses the request fails with the `'timeout'` [McpFailureReason](../type-aliases/McpFailureReason.md). Defaults to the SDK's `DEFAULT_REQUEST_TIMEOUT_MSEC`, 60 000. For [listMcpTools](../functions/listMcpTools.md) it applies to each page. Must be a positive, finite number no greater than 2³¹−1 (`setTimeout`'s limit; the SDK would otherwise fire a larger or infinite value after 1 ms); anything else fails with `'invalid-options'` before a request is sent. |
