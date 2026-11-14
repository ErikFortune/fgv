[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / defaultMemoryScopeEncoding

# Function: defaultMemoryScopeEncoding()

> **defaultMemoryScopeEncoding**(`scope`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Encode a [MemoryScopeKey](../type-aliases/MemoryScopeKey.md) to its on-disk directory path. The scope may
be multi-segment (`/`-separated) — each component is validated independently
against the POSIX portable filename set (via
[assertPortableFilenameStem](assertPortableFilenameStem.md)), then rejoined with `/`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

## Remarks

This is the day-one multi-segment scope resolver design-lock §9.1 calls for:
the knowledge scope is the single segment `knowledge`, while the Phase-C MTM
scope `conversations/<conversationId>` is two segments. Validating each
segment independently (rather than the whole path as one stem, which the
`ts-prompt-assist` default encoding does) keeps the Phase-C codec additive —
no scope-encoding change is needed when MTM ships.
