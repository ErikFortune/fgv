[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [RecordJar](../README.md) / readRecordJarFileSync

# Function: readRecordJarFileSync()

> **readRecordJarFileSync**(`srcPath`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JarRecord`](../type-aliases/JarRecord.md)[]\>

Reads a record-jar file from a supplied path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `srcPath` | `string` | Source path from which the file is read. |
| `options?` | [`JarRecordParserOptions`](../interfaces/JarRecordParserOptions.md) | Optional parser configuration |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JarRecord`](../type-aliases/JarRecord.md)[]\>

The contents of the file as an array of `Record<string, string>`

## See

https://datatracker.ietf.org/doc/html/draft-phillips-record-jar-01
