[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IValidatingEditorContextParams

# Interface: IValidatingEditorContextParams\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/validatingEditorContext.ts:40](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validatingEditorContext.ts#L40)

Parameters for creating a validating editor context.
Extends base editor context params with converter configuration.

## Extends

- [`IEditorContextParams`](IEditorContextParams.md)\<`T`, `TBaseId`, `TId`\>

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

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:51](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L51)

The mutable collection to edit.

#### Inherited from

[`IEditorContextParams`](IEditorContextParams.md).[`collection`](IEditorContextParams.md#collection)

***

### createId

> `readonly` **createId**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:69](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L69)

Converter used to create a composite ID from a `{ collectionId, itemId }` object.

#### Remarks

Callers can typically pass the canonical ID converter for the entity type (e.g.
`CommonConverters.ingredientId`). The editor context will construct a composite-id
object and call this converter.

#### Inherited from

[`IEditorContextParams`](IEditorContextParams.md).[`createId`](IEditorContextParams.md#createid)

***

### entityConverter

> `readonly` **entityConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/validatingEditorContext.ts:49](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validatingEditorContext.ts#L49)

Converter for entity validation.
Handles type validation, required fields, and constraints.

***

### getBaseId()

> `readonly` **getBaseId**: (`entity`) => `TBaseId` \| `undefined`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:77](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L77)

Function to extract base ID from entity.
Required to support ID generation and uniqueness checking.

#### Parameters

##### entity

`T`

Entity to extract base ID from

#### Returns

`TBaseId` \| `undefined`

Base ID or undefined if not set

#### Inherited from

[`IEditorContextParams`](IEditorContextParams.md).[`getBaseId`](IEditorContextParams.md#getbaseid)

***

### getName()

> `readonly` **getName**: (`entity`) => `string`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:85](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L85)

Function to extract name from entity.
Used for auto-generating base IDs from names.

#### Parameters

##### entity

`T`

Entity to extract name from

#### Returns

`string`

Entity name

#### Inherited from

[`IEditorContextParams`](IEditorContextParams.md).[`getName`](IEditorContextParams.md#getname)

***

### keyConverter

> `readonly` **keyConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`\>

Defined in: [ts-chocolate/src/packlets/editing/validatingEditorContext.ts:55](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/validatingEditorContext.ts#L55)

Converter for base ID validation.
Validates and converts string input to the base ID type.

***

### semanticValidator()?

> `readonly` `optional` **semanticValidator**: (`entity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:59](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L59)

Optional semantic validator for cross-field and business rules.
Runs on pre-validated entities.

#### Parameters

##### entity

`T`

Pre-validated entity to check

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result<true> if valid, failure with message otherwise

#### Inherited from

[`IEditorContextParams`](IEditorContextParams.md).[`semanticValidator`](IEditorContextParams.md#semanticvalidator)
