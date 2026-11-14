[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / ITerritoryQualifierTypeCreateParams

# Interface: ITerritoryQualifierTypeCreateParams

Parameters used to create a new [TerritoryQualifierType](../classes/TerritoryQualifierType.md) instance.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-acceptlowercase"></a> `acceptLowercase?` | `boolean` | Flag indicating whether the qualifier type should accept lowercase territory codes. Defaults to `false`. |
| <a id="property-allowcontextlist"></a> `allowContextList?` | `boolean` | Flag indicating whether this qualifier type allows a list of values in a context. Defaults to `false`. |
| <a id="property-allowedterritories"></a> `allowedTerritories?` | `string`[] | Optional array enumerating allowed territories to further constrain the type. |
| <a id="property-hierarchy"></a> `hierarchy?` | [`LiteralValueHierarchyDecl`](../namespaces/Config/type-aliases/LiteralValueHierarchyDecl.md)\<`string`\> | Optional [hierarchy declaration](../namespaces/Config/type-aliases/LiteralValueHierarchyDecl.md) of territory values to use for matching. If not provided, no hierarchy will be used. |
| <a id="property-index"></a> `index?` | `number` | Global index for this qualifier type. |
| <a id="property-name"></a> `name?` | `string` | The name of the qualifier type. No default value. |
