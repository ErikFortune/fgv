[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / embeddingRefOf

# Function: embeddingRefOf()

> **embeddingRefOf**(`envelope`): `string` \| `undefined`

The envelope's embedding reference if it carries a usable one, `undefined`
otherwise — **the one place `null`-vs-absent is collapsed.**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `envelope` | [`IMemoryEnvelope`](../interfaces/IMemoryEnvelope.md) |

## Returns

`string` \| `undefined`

## Remarks

[IMemoryEnvelope.embeddingRef](../interfaces/IMemoryEnvelope.md#property-embeddingref) is `string | null | undefined`, where
`null` and absent both mean *not embedded* (`null` is the explicit sentinel;
absent is the backwards-compat seam). That makes the obvious presence check
wrong in **both** directions, and both mistakes were shipped before this
accessor existed: `!== undefined` counts a `null` as an embedding that is not
there, and `=== undefined` misses a `null` when looking for one that is
missing. Neither is a type error, and neither is visible to a coverage gate,
because the sentinel is a *value* rather than a branch.

Returning the reference rather than a boolean is deliberate: a caller that
needs the string gets the check for free, so there is no second, weaker way
to ask.

**Do not test `embeddingRef` for presence directly — call this.**
