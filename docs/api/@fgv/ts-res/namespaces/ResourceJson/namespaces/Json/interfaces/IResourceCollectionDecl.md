[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IResourceCollectionDecl

# Interface: IResourceCollectionDecl\<TQualifierNames\>

Non-validated declaration of a collection of resources.

## Remarks

Parameterized on `TQualifierNames` so the `context`, `candidates`, and
`resources` fields thread the narrowed axis-name set throughout the
collection. Defaults to `string` for back-compat.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-candidates"></a> `candidates?` | `readonly` | readonly [`ILooseResourceCandidateDecl`](ILooseResourceCandidateDecl.md)\<`TQualifierNames`\>[] |
| <a id="property-collections"></a> `collections?` | `readonly` | readonly `IResourceCollectionDecl`\<`TQualifierNames`\>[] |
| <a id="property-context"></a> `context?` | `readonly` | [`IContainerContextDecl`](IContainerContextDecl.md)\<`TQualifierNames`\> |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| <a id="property-resources"></a> `resources?` | `readonly` | readonly [`ILooseResourceDecl`](ILooseResourceDecl.md)\<`TQualifierNames`\>[] |
