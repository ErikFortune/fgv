[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [SaferFetch](../README.md) / GuardedFetch

# Type Alias: GuardedFetch

> **GuardedFetch** = (`url`, `init?`) => `Promise`\<`Response`\>

A `fetch`-shaped function whose every request goes through the safer-fetch hop walk, and whose
response body is returned **unread**. Created by [SaferFetch.createGuardedFetch](../functions/createGuardedFetch.md).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` \| `URL` |
| `init?` | `RequestInit` |

## Returns

`Promise`\<`Response`\>

## Remarks

Structurally the same as the `FetchLike` that fetch-accepting libraries take (the MCP SDK's
transports among them), so it can be handed to any of them.

It **rejects** on every failure, as a fetch-shaped caller expects, with a
[SaferFetch.GuardedFetchError](../classes/GuardedFetchError.md) carrying the `FetchFailureReason`. A non-2xx answer is not a
failure: it is returned, as `fetch` returns it, because fetch-shaped callers branch on it.
