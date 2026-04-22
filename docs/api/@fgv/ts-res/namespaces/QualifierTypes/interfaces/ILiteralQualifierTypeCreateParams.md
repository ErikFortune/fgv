[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / ILiteralQualifierTypeCreateParams

# Interface: ILiteralQualifierTypeCreateParams

Interface defining the parameters that can be used to create a new
[LiteralQualifierType](../classes/LiteralQualifierType.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allowcontextlist"></a> `allowContextList?` | `boolean` | Optional flag indicating whether the context can be a list of values. Defaults to `true`. |
| <a id="casesensitive"></a> `caseSensitive?` | `boolean` | Optional flag indicating whether the match should be case-sensitive. Defaults to `false`. |
| <a id="enumeratedvalues"></a> `enumeratedValues?` | readonly `string`[] | Optional array of enumerated values to further constrain the type. Defaults to no constraint. |
| <a id="hierarchy"></a> `hierarchy?` | [`LiteralValueHierarchyDecl`](../namespaces/Config/type-aliases/LiteralValueHierarchyDecl.md)\<`string`\> | Optional [hierarchy declaration](../namespaces/Config/type-aliases/LiteralValueHierarchyDecl.md) of literal values to use for matching. If not provided, no hierarchy will be used. |
| <a id="index"></a> `index?` | `number` | Global index for this qualifier type. |
| <a id="name"></a> `name?` | `string` | Optional name for the qualifier type. Defaults to 'literal'. |
