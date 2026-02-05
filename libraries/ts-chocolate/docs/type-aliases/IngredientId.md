[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / IngredientId

# Type Alias: IngredientId

> **IngredientId** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"IngredientId"`\>

Defined in: [ts-chocolate/src/packlets/common/ids.ts:91](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/common/ids.ts#L91)

Globally unique ingredient identifier (composite)
Format: "collectionId.baseIngredientId"
Must contain exactly one dot separator
Pattern: /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+$/
