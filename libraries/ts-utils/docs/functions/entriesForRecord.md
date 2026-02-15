[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / entriesForRecord

# Function: entriesForRecord()

> **entriesForRecord**\<`TK`, `TV`\>(`obj`): \[`TK`, `TV`\][]

Type-safe(ish) entries extractor for typed records.

## Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |
| `TV` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `obj` | `Record`\<`TK`, `TV`\> | The record from which entries are to be extracted. |

## Returns

\[`TK`, `TV`\][]

The entries of the record as an array of `[key, value]` tuples.
