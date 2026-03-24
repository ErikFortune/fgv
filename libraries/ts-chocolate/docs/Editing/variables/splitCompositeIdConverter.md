[Home](../../README.md) > [Editing](../README.md) > splitCompositeIdConverter

# Variable: splitCompositeIdConverter

Pre-built converter that splits a composite entity ID (e.g. `"my-collection.my-entity"`)
into its validated collection and item ID parts.

For domain-specific composite IDs (e.g. IngredientId, LocationId), prefer the
corresponding parsed converter (e.g. `parsedIngredientId`, `parsedLocationId`)
which validates both parts.

## Type

`Converter<ISplitCompositeId>`
