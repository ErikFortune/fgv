[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IEditorContextValidator

# Interface: IEditorContextValidator\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:122](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/model.ts#L122)

Validating wrapper interface for editor context.
Provides methods that accept raw (unknown) input, validate using converters,
and delegate to the base editor context.

## Type Parameters

### T

`T`

Entity type

### TBaseId

`TBaseId` *extends* `string` = `string`

Base ID type (e.g., BaseIngredientId) - used for type consistency with implementation

### TId

`TId` *extends* `string` = `string`

Composite ID type (e.g., IngredientId)

## Properties

### create()

> `readonly` **create**: (`baseId`, `rawEntity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:129](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/model.ts#L129)

Create new entity with validation.

#### Parameters

##### baseId

`string`

Raw base identifier string, or empty string to auto-generate from entity name

##### rawEntity

`unknown`

Raw entity data to validate and create

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Result containing the generated entity ID or failure

***

### update()

> `readonly` **update**: (`id`, `rawEntity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:137](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/model.ts#L137)

Update existing entity with validation.

#### Parameters

##### id

`TId`

Entity ID

##### rawEntity

`unknown`

Raw updated entity data to validate

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result indicating success or failure

***

### validate()

> `readonly` **validate**: (`rawEntity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](IValidationReport.md)\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:144](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/model.ts#L144)

Validate raw entity data using converter and semantic validator.

#### Parameters

##### rawEntity

`unknown`

Raw entity data to validate

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](IValidationReport.md)\>

Result containing validation report or failure
