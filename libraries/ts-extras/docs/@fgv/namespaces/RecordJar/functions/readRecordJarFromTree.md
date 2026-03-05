[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [RecordJar](../README.md) / readRecordJarFromTree

# Function: readRecordJarFromTree()

> **readRecordJarFromTree**(`fileTree`, `filePath`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JarRecord`](../type-aliases/JarRecord.md)[]\>

Reads a record-jar file from a FileTree.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The FileTree to read from. |
| `filePath` | `string` | Path of the file within the tree. |
| `options?` | [`JarRecordParserOptions`](../interfaces/JarRecordParserOptions.md) | Optional parser configuration |

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`JarRecord`](../type-aliases/JarRecord.md)[]\>

The contents of the file as an array of `Record<string, string>`

## See

https://datatracker.ietf.org/doc/html/draft-phillips-record-jar-01
