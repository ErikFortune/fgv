[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / recordFromEntries

# Function: recordFromEntries()

> **recordFromEntries**\<`TK`, `TV`\>(`entries`): `Record`\<`TK`, `TV`\>

Type-safe(ish) record constructor from an iterable of `[key, value]` tuples.

## Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |
| `TV` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `entries` | `Iterable`\<\[`TK`, `TV`\]\> | The iterable of `[key, value]` tuples from which to construct the record. |

## Returns

`Record`\<`TK`, `TV`\>

A record constructed from the supplied entries.
