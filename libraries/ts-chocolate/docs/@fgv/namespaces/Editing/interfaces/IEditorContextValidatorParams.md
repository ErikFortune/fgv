[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IEditorContextValidatorParams

# Interface: IEditorContextValidatorParams\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:37](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L37)

Parameters for creating an editor context validator.

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

### context

> `readonly` **context**: [`EditorContext`](../classes/EditorContext.md)\<`T`, `TBaseId`, `TId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:45](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L45)

The editor context to wrap with validation.

***

### entityConverter

> `readonly` **entityConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:51](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L51)

Converter for entity validation.
Handles type validation, required fields, and constraints.

***

### keyConverter

> `readonly` **keyConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContextValidator.ts:57](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/editorContextValidator.ts#L57)

Converter for base ID validation.
Validates and converts string input to the base ID type.
