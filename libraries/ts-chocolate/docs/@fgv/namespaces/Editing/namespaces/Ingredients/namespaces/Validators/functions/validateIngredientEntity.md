[**@fgv/ts-chocolate**](../../../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../../../README.md) / [Editing](../../../../../README.md) / [Ingredients](../../../README.md) / [Validators](../README.md) / validateIngredientEntity

# Function: validateIngredientEntity()

> **validateIngredientEntity**(`entity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientEntity`](../../../../../../Entities/type-aliases/IngredientEntity.md)\>

Defined in: [ts-chocolate/src/packlets/editing/ingredients/validators.ts:205](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/editing/ingredients/validators.ts#L205)

Validate entity-level constraints that span multiple fields.
This should be called after individual field validation.

## Parameters

### entity

[`IngredientEntity`](../../../../../../Entities/type-aliases/IngredientEntity.md)

Complete ingredient entity to validate

## Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientEntity`](../../../../../../Entities/type-aliases/IngredientEntity.md)\>

Result indicating validation success or failure
