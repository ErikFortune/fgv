[**@fgv/ts-sudoku-lib**](../README.md)

***

[@fgv/ts-sudoku-lib](../README.md) / IPuzzleDefinition

# Interface: IPuzzleDefinition

Complete puzzle definition with derived properties

## Extends

- [`IPuzzleDimensions`](IPuzzleDimensions.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="basiccagetotal"></a> `basicCageTotal` | `readonly` | `number` | - |
| <a id="boardheightincages"></a> `boardHeightInCages` | `readonly` | `number` | Number of cages vertically (e.g., 3 for standard Sudoku) |
| <a id="boardwidthincages"></a> `boardWidthInCages` | `readonly` | `number` | Number of cages horizontally (e.g., 3 for standard Sudoku) |
| <a id="cageheightincells"></a> `cageHeightInCells` | `readonly` | `number` | Height of each section/cage (e.g., 3 for standard Sudoku) |
| <a id="cages"></a> `cages?` | `readonly` | [`ICage`](ICage.md)[] | - |
| <a id="cagewidthincells"></a> `cageWidthInCells` | `readonly` | `number` | Width of each section/cage (e.g., 3 for standard Sudoku) |
| <a id="cells"></a> `cells` | `readonly` | `string` | - |
| <a id="description"></a> `description` | `readonly` | `string` | - |
| <a id="id"></a> `id?` | `readonly` | `string` | - |
| <a id="level"></a> `level` | `readonly` | `number` | - |
| <a id="maxvalue"></a> `maxValue` | `readonly` | `number` | - |
| <a id="totalcages"></a> `totalCages` | `readonly` | `number` | - |
| <a id="totalcolumns"></a> `totalColumns` | `readonly` | `number` | - |
| <a id="totalrows"></a> `totalRows` | `readonly` | `number` | - |
| <a id="type"></a> `type` | `readonly` | [`PuzzleType`](../type-aliases/PuzzleType.md) | - |
