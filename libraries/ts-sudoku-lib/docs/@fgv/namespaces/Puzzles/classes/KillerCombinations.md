[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Puzzles](../README.md) / KillerCombinations

# Class: KillerCombinations

Helper class providing UI assistance functions for killer sudoku puzzle solving.
Generates possible totals, number combinations with constraints, and cell-specific
possibilities based on current puzzle state.

## Constructors

### Constructor

> **new KillerCombinations**(): `KillerCombinations`

#### Returns

`KillerCombinations`

## Methods

### getCellPossibilities()

> `static` **getCellPossibilities**(`puzzle`, `state`, `cage`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Map`\<[`CellId`](../../../../type-aliases/CellId.md), `number`[]\>\>

Determines possible values for each cell in a killer cage based on current puzzle state.

Analyzes the current state of the puzzle and cage to determine which values
are possible for each empty cell, considering both killer cage constraints
and standard sudoku constraints (row, column, section uniqueness).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `puzzle` | [`Puzzle`](../../../../classes/Puzzle.md) | The puzzle instance |
| `state` | [`PuzzleState`](../../../../classes/PuzzleState.md) | Current puzzle state |
| `cage` | [`ICage`](../../../../interfaces/ICage.md) | The killer cage to analyze (must be of type 'killer') |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Map`\<[`CellId`](../../../../type-aliases/CellId.md), `number`[]\>\>

Result containing map of CellId to possible number arrays

#### Example

```typescript
const cage = puzzle.getCage(cageId).orThrow();
const possibilities = KillerCombinations.getCellPossibilities(puzzle, state, cage);
if (possibilities.isSuccess()) {
  for (const [cellId, values] of possibilities.value) {
    console.log(`Cell ${cellId} can have values: ${values.join(', ')}`);
  }
}
```

***

### getCombinations()

> `static` **getCombinations**(`cageSize`, `total`, `constraints?`, `maxValue?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`[][]\>

Generates all possible number combinations that sum to the target total.

Each combination contains unique numbers from 1-9 that sum exactly to the
specified total. Combinations respect both excluded and required number
constraints if provided.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `cageSize` | `number` | `undefined` | The number of cells in the cage (must be 1-9) |
| `total` | `number` | `undefined` | The target sum (must be valid for the cage size) |
| `constraints?` | [`IKillerConstraints`](../interfaces/IKillerConstraints.md) | `undefined` | Optional constraints on included/excluded numbers |
| `maxValue?` | `number` | `9` | - |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`[][]\>

Result containing array of combinations, each sorted in ascending order

#### Example

```typescript
// Get all combinations for a 3-cell cage with total 15
const result = KillerCombinations.getCombinations(3, 15);
if (result.isSuccess()) {
  console.log(result.value); // [[1,5,9], [1,6,8], [2,4,9], ...]
}

// With constraints - exclude 1 and 2, require 9
const constrained = KillerCombinations.getCombinations(3, 15, {
  excludedNumbers: [1, 2],
  requiredNumbers: [9]
});
```

***

### getPossibleTotals()

> `static` **getPossibleTotals**(`cageSize`, `maxValue`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`[]\>

Gets all mathematically possible totals for a given cage size.

Uses the existing totalsByCageSize constant to determine the valid range
of totals for the specified cage size and returns all integers in that range.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `cageSize` | `number` | `undefined` | The number of cells in the cage (must be 1-9) |
| `maxValue` | `number` | `9` | - |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`number`[]\>

Result containing array of possible totals in ascending order

#### Example

```typescript
// Get possible totals for a 3-cell cage
const result = KillerCombinations.getPossibleTotals(3);
if (result.isSuccess()) {
  console.log(result.value); // [6, 7, 8, 9, ..., 24]
}
```
