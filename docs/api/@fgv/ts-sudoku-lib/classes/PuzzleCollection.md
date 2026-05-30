[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / PuzzleCollection

# Class: PuzzleCollection

A collection of puzzles of various types.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="puzzles"></a> `puzzles` | `readonly` | readonly [`IPuzzleFileData`](../namespaces/Files/namespaces/Model/interfaces/IPuzzleFileData.md)[] | All puzzles in the collection. |

## Methods

### getDescription()

> **getDescription**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleFileData`](../namespaces/Files/namespaces/Model/interfaces/IPuzzleFileData.md)\>

Gets a puzzle by id from this collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The string ID of the puzzle to be returned. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleFileData`](../namespaces/Files/namespaces/Model/interfaces/IPuzzleFileData.md)\>

`Success` with the requested [puzzle](PuzzleSession.md), or
`Failure` with details if an error occurs.

***

### getPuzzle()

> **getPuzzle**(`id`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`PuzzleSession`](PuzzleSession.md)\>

Gets a puzzle by id from this collection.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | The string ID of the puzzle to be returned. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`PuzzleSession`](PuzzleSession.md)\>

`Success` with the requested [puzzle](PuzzleSession.md), or
`Failure` with details if an error occurs.

***

### create()

> `static` **create**(`from`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PuzzleCollection`\>

Creates a new puzzle from a loaded [PuzzlesFile](../namespaces/Files/namespaces/Model/interfaces/IPuzzlesFile.md)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `from` | [`IPuzzlesFile`](../namespaces/Files/namespaces/Model/interfaces/IPuzzlesFile.md) | The [puzzles file](../namespaces/Files/namespaces/Model/interfaces/IPuzzlesFile.md) to be loaded. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PuzzleCollection`\>

`Success` with the resulting PuzzleCollection
or `Failure` with details if an error occurs.

***

### load()

> `static` **load**(`file`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PuzzleCollection`\>

Creates a new puzzle from a JSON file.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `file` | [`IFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | file item to be loaded. |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`PuzzleCollection`\>

`Success` with the resulting PuzzleCollection
or `Failure` with details if an error occurs.
