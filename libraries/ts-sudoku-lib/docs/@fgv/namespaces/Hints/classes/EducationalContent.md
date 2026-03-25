[**@fgv/ts-sudoku-lib**](../../../../README.md)

***

[@fgv/ts-sudoku-lib](../../../../README.md) / [Hints](../README.md) / EducationalContent

# Class: EducationalContent

Educational content manager for Sudoku solving techniques.

## Constructors

### Constructor

> **new EducationalContent**(): `EducationalContent`

#### Returns

`EducationalContent`

## Methods

### createBeginnerGuide()

> `static` **createBeginnerGuide**(): `string`

Creates a complete educational guide for beginners.

#### Returns

`string`

Comprehensive beginner guide

***

### getDifficultyProgression()

> `static` **getDifficultyProgression**(): readonly `string`[]

Gets difficulty progression advice.

#### Returns

readonly `string`[]

Advice for progressing through difficulty levels

***

### getGeneralSolvingTips()

> `static` **getGeneralSolvingTips**(): readonly `string`[]

Gets general Sudoku solving advice.

#### Returns

readonly `string`[]

Array of general solving tips

***

### getTechniqueIntroduction()

> `static` **getTechniqueIntroduction**(`techniqueId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Gets an introduction to a specific technique.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The technique to introduce |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Result containing the introduction text

***

### getTechniqueOverview()

> `static` **getTechniqueOverview**(`techniqueId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Gets a complete educational overview for a technique.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The technique to describe |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Result containing the complete overview

***

### getTechniqueRelationships()

> `static` **getTechniqueRelationships**(`techniqueId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `string`[]\>

Gets relationship information for a technique.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The technique to get relationships for |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `string`[]\>

Result containing the relationship information
