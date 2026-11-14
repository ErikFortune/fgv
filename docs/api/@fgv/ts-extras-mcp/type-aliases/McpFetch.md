[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / McpFetch

# Type Alias: McpFetch

> **McpFetch** = (`url`, `init?`) => `Promise`\<`Response`\>

The `fetch` a Streamable-HTTP transport sends every request through. Structurally the same as
`SaferFetch.GuardedFetch` from `@fgv/ts-extras`, so a function from `SaferFetch.createGuardedFetch`
fits it directly.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `url` | `string` \| `URL` |
| `init?` | `RequestInit` |

## Returns

`Promise`\<`Response`\>
