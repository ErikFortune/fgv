[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / EditorContextValidator

# Class: EditorContextValidator\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:75](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L75)

Validating wrapper for EditorContext.
Provides methods that accept raw (unknown) input, validate using converters,
and delegate to the base editor context.
Follows the ResultMapValidator pattern from ts-utils.

## Type Parameters

### T

`T`

Entity type

### TBaseId

`TBaseId` *extends* `string` = `string`

Base ID type (e.g., BaseIngredientId)

### TId

`TId` *extends* `string` = `string`

Composite ID type (e.g., IngredientId)

## Implements

- [`IEditorContextValidator`](../interfaces/IEditorContextValidator.md)\<`T`, `TBaseId`, `TId`\>

## Constructors

### Constructor

> **new EditorContextValidator**\<`T`, `TBaseId`, `TId`\>(`params`): `EditorContextValidator`\<`T`, `TBaseId`, `TId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:86](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L86)

Create an editor context validator.

#### Parameters

##### params

[`IEditorContextValidatorParams`](../interfaces/IEditorContextValidatorParams.md)\<`T`, `TBaseId`, `TId`\>

Validator parameters

#### Returns

`EditorContextValidator`\<`T`, `TBaseId`, `TId`\>

## Methods

### create()

> **create**(`baseId`, `rawEntity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:99](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L99)

Create new entity with validation.
Validates the raw entity using the converter, then delegates to the base context.

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

#### Implementation of

[`IEditorContextValidator`](../interfaces/IEditorContextValidator.md).[`create`](../interfaces/IEditorContextValidator.md#create)

***

### update()

> **update**(`id`, `rawEntity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:124](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L124)

Update existing entity with validation.
Validates the raw entity using the converter, then delegates to the base context.

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

#### Implementation of

[`IEditorContextValidator`](../interfaces/IEditorContextValidator.md).[`update`](../interfaces/IEditorContextValidator.md#update)

***

### validate()

> **validate**(`rawEntity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](../interfaces/IValidationReport.md)\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:136](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L136)

Validate raw entity data using converter and semantic validator.

#### Parameters

##### rawEntity

`unknown`

Raw entity data to validate

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](../interfaces/IValidationReport.md)\>

Result containing validation report or failure

#### Implementation of

[`IEditorContextValidator`](../interfaces/IEditorContextValidator.md).[`validate`](../interfaces/IEditorContextValidator.md#validate)
