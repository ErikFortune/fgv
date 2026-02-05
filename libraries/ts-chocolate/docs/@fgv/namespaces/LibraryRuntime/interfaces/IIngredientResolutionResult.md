[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IIngredientResolutionResult

# Interface: IIngredientResolutionResult\<TIngredient\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:720](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L720)

Result of attempting to resolve an ingredient reference.
Used when partial resolution is acceptable (e.g., for alternates).

## Type Parameters

### TIngredient

`TIngredient` *extends* [`IIngredient`](IIngredient.md) = [`IIngredient`](IIngredient.md)

## Properties

### error?

> `readonly` `optional` **error**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:734](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L734)

Error message (if status is 'missing' or 'error')

***

### ingredient?

> `readonly` `optional` **ingredient**: `TIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:729](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L729)

The resolved ingredient (if status is 'resolved')

***

### status

> `readonly` **status**: [`ResolutionStatus`](../type-aliases/ResolutionStatus.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:724](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L724)

The resolution status
