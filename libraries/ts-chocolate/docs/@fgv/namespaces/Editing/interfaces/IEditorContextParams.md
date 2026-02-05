[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IEditorContextParams

# Interface: IEditorContextParams\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:47](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L47)

Parameters for creating a base editor context.
The base context accepts pre-validated entities and base IDs.
For raw input handling, use ValidatingEditorContext.

## Extended by

- [`IValidatingEditorContextParams`](IValidatingEditorContextParams.md)

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

## Properties

### collection

> `readonly` **collection**: [`EditableCollection`](../classes/EditableCollection.md)\<`T`, `TBaseId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:51](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L51)

The mutable collection to edit.

***

### createId

> `readonly` **createId**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:69](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L69)

Converter used to create a composite ID from a `{ collectionId, itemId }` object.

#### Remarks

Callers can typically pass the canonical ID converter for the entity type (e.g.
`CommonConverters.ingredientId`). The editor context will construct a composite-id
object and call this converter.

***

### getBaseId()

> `readonly` **getBaseId**: (`entity`) => `TBaseId` \| `undefined`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:77](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L77)

Function to extract base ID from entity.
Required to support ID generation and uniqueness checking.

#### Parameters

##### entity

`T`

Entity to extract base ID from

#### Returns

`TBaseId` \| `undefined`

Base ID or undefined if not set

***

### getName()

> `readonly` **getName**: (`entity`) => `string`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:85](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L85)

Function to extract name from entity.
Used for auto-generating base IDs from names.

#### Parameters

##### entity

`T`

Entity to extract name from

#### Returns

`string`

Entity name

***

### semanticValidator()?

> `readonly` `optional` **semanticValidator**: (`entity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:59](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L59)

Optional semantic validator for cross-field and business rules.
Runs on pre-validated entities.

#### Parameters

##### entity

`T`

Pre-validated entity to check

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result<true> if valid, failure with message otherwise
