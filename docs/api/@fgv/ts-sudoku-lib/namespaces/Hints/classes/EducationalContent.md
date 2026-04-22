[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-sudoku-lib](../../../README.md) / [Hints](../README.md) / EducationalContent

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

> `static` **getTechniqueIntroduction**(`techniqueId`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets an introduction to a specific technique.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The technique to introduce |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Result containing the introduction text

***

### getTechniqueOverview()

> `static` **getTechniqueOverview**(`techniqueId`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Gets a complete educational overview for a technique.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The technique to describe |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Result containing the complete overview

***

### getTechniqueRelationships()

> `static` **getTechniqueRelationships**(`techniqueId`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Gets relationship information for a technique.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `techniqueId` | [`TechniqueId`](../type-aliases/TechniqueId.md) | The technique to get relationships for |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Result containing the relationship information
