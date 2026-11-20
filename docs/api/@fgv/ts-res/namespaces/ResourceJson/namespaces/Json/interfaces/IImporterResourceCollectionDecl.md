[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IImporterResourceCollectionDecl

# Interface: IImporterResourceCollectionDecl\<TQualifierNames\>

Non-validated declaration of a collection of resources for an importer.

## Remarks

Parameterized on `TQualifierNames` so the `context`, `candidates`, and
`resources` fields thread the narrowed axis-name set throughout the
importer collection. Defaults to `string` for back-compat.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-candidates"></a> `candidates?` | `readonly` | readonly [`IImporterResourceCandidateDecl`](IImporterResourceCandidateDecl.md)\<`TQualifierNames`\>[] |
| <a id="property-collections"></a> `collections?` | `readonly` | readonly `IImporterResourceCollectionDecl`\<`TQualifierNames`\>[] |
| <a id="property-context"></a> `context?` | `readonly` | [`IContainerContextDecl`](IContainerContextDecl.md)\<`TQualifierNames`\> |
| <a id="property-metadata"></a> `metadata?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| <a id="property-resources"></a> `resources?` | `readonly` | readonly [`IImporterResourceDecl`](../type-aliases/IImporterResourceDecl.md)\<`TQualifierNames`\>[] |
