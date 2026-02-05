[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Helpers](../README.md) / createIngredientId

# Function: createIngredientId()

> **createIngredientId**(`collectionId`, `baseId`): [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/common/helpers.ts:81](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/helpers.ts#L81)

Creates a composite IngredientId from collection ID and base ID

## Parameters

### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection identifier

### baseId

[`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

The base ingredient identifier

## Returns

[`IngredientId`](../../../../type-aliases/IngredientId.md)

Composite ingredient ID in format "collectionId.baseId"
