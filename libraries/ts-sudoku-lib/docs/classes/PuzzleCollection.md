[**@fgv/ts-sudoku-lib**](../README.md)

***

[@fgv/ts-sudoku-lib](../README.md) / PuzzleCollection

# Class: PuzzleCollection

A collection of puzzles of various types.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="puzzles"></a> `puzzles` | `readonly` | readonly [`IPuzzleFileData`](../@fgv/namespaces/Files/namespaces/Model/interfaces/IPuzzleFileData.md)[] | All puzzles in the collection. |

## Methods

### getDescription()

> **getDescription**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleFileData`](../@fgv/namespaces/Files/namespaces/Model/interfaces/IPuzzleFileData.md)\>

Gets a puzzle by id from this collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The string ID of the puzzle to be returned. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IPuzzleFileData`](../@fgv/namespaces/Files/namespaces/Model/interfaces/IPuzzleFileData.md)\>

`Success` with the requested [puzzle](PuzzleSession.md), or
`Failure` with details if an error occurs.

***

### getPuzzle()

> **getPuzzle**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`PuzzleSession`](PuzzleSession.md)\>

Gets a puzzle by id from this collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The string ID of the puzzle to be returned. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`PuzzleSession`](PuzzleSession.md)\>

`Success` with the requested [puzzle](PuzzleSession.md), or
`Failure` with details if an error occurs.

***

### create()

> `static` **create**(`from`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleCollection`\>

Creates a new puzzle from a loaded [PuzzlesFile](../@fgv/namespaces/Files/namespaces/Model/interfaces/IPuzzlesFile.md)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | [`IPuzzlesFile`](../@fgv/namespaces/Files/namespaces/Model/interfaces/IPuzzlesFile.md) | The [puzzles file](../@fgv/namespaces/Files/namespaces/Model/interfaces/IPuzzlesFile.md) to be loaded. |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleCollection`\>

`Success` with the resulting PuzzleCollection
or `Failure` with details if an error occurs.

***

### load()

> `static` **load**(`file`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleCollection`\>

Creates a new puzzle from a JSON file.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `file` | [`IFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`PuzzleCollection`\>

`Success` with the resulting PuzzleCollection
or `Failure` with details if an error occurs.
