[**@fgv/ts-utils**](../README.md)

***

[@fgv/ts-utils](../README.md) / keysForRecord

# Function: keysForRecord()

> **keysForRecord**\<`TK`\>(`obj`): `TK`[]

Type-safe(ish) key extractor for typed records.

## Type Parameters

| Type Parameter |
| ------ |
| `TK` *extends* `string` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `obj` | `Record`\<`TK`, `unknown`\> | The record from which keys are to be extracted. |

## Returns

`TK`[]

The keys of the record as an array.
