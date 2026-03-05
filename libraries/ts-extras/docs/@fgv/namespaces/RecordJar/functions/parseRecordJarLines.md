[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [RecordJar](../README.md) / parseRecordJarLines

# Function: parseRecordJarLines()

> **parseRecordJarLines**(`lines`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JarRecord`](../type-aliases/JarRecord.md)[]\>

Reads a record-jar from an array of strings, each of which represents one
line in the source file.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `lines` | `string`[] | the array of strings to be parsed |
| `options?` | [`JarRecordParserOptions`](../interfaces/JarRecordParserOptions.md) | Optional parser configuration |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JarRecord`](../type-aliases/JarRecord.md)[]\>

a corresponding array of `Record<string, string>`
