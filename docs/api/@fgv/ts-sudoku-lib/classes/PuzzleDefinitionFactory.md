[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-lib](../README.md) / PuzzleDefinitionFactory

# Class: PuzzleDefinitionFactory

Factory for creating and validating puzzle definitions

## Constructors

### Constructor

> **new PuzzleDefinitionFactory**(): `PuzzleDefinitionFactory`

#### Returns

`PuzzleDefinitionFactory`

## Methods

### create()

> `static` **create**(`dimensions`, `options`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md)\>

Create a puzzle definition from dimensions and options

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dimensions` | [`IPuzzleDimensions`](../interfaces/IPuzzleDimensions.md) |
| `options` | `Partial`\<[`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md)\> |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md)\>

***

### createKiller()

> `static` **createKiller**(`dimensions`, `description`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md)\>

Create killer sudoku puzzle definition with cage constraints

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dimensions` | [`IPuzzleDimensions`](../interfaces/IPuzzleDimensions.md) |
| `description` | `Omit`\<[`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md), `"totalRows"` \| `"totalColumns"` \| `"maxValue"` \| `"totalCages"` \| `"basicCageTotal"` \| `"cages"` \| `"cageWidthInCells"` \| `"cageHeightInCells"` \| `"boardWidthInCages"` \| `"boardHeightInCages"`\> & `object` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IPuzzleDefinition`](../interfaces/IPuzzleDefinition.md)\>

***

### getStandardConfig()

> `static` **getStandardConfig**(`name`): [`IPuzzleDimensions`](../interfaces/IPuzzleDimensions.md)

Get a standard configuration by name

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `"puzzle4x4"` \| `"puzzle6x6"` \| `"puzzle9x9"` \| `"puzzle12x12"` |

#### Returns

[`IPuzzleDimensions`](../interfaces/IPuzzleDimensions.md)

***

### getStandardConfigs()

> `static` **getStandardConfigs**(): `Record`\<[`StandardConfigName`](../type-aliases/StandardConfigName.md), [`IPuzzleDimensions`](../interfaces/IPuzzleDimensions.md)\>

Get all available standard configurations

#### Returns

`Record`\<[`StandardConfigName`](../type-aliases/StandardConfigName.md), [`IPuzzleDimensions`](../interfaces/IPuzzleDimensions.md)\>

***

### getValidator()

> `static` **getValidator**(`puzzleType`): [`IPuzzleTypeValidator`](../interfaces/IPuzzleTypeValidator.md) \| `undefined`

Get validator for a specific puzzle type

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `puzzleType` | [`PuzzleType`](../type-aliases/PuzzleType.md) |

#### Returns

[`IPuzzleTypeValidator`](../interfaces/IPuzzleTypeValidator.md) \| `undefined`

***

### registerValidator()

> `static` **registerValidator**(`puzzleType`, `validator`): `void`

Register a custom validator for a puzzle type

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `puzzleType` | [`PuzzleType`](../type-aliases/PuzzleType.md) |
| `validator` | [`IPuzzleTypeValidator`](../interfaces/IPuzzleTypeValidator.md) |

#### Returns

`void`

***

### validate()

> `static` **validate**(`dimensions`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Validate puzzle dimensions

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `dimensions` | [`IPuzzleDimensions`](../interfaces/IPuzzleDimensions.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>
