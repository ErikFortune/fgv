[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Normalized](../README.md) / IImporterResourceCollectionDecl

# Interface: IImporterResourceCollectionDecl

Normalized non-validated declaration of a collection of resources for importers.
This allows for a mix of loose and child resource declarations.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="candidates"></a> `candidates?` | `readonly` | readonly [`IImporterResourceCandidateDecl`](IImporterResourceCandidateDecl.md)[] |
| <a id="collections"></a> `collections?` | `readonly` | readonly `IImporterResourceCollectionDecl`[] |
| <a id="context"></a> `context?` | `readonly` | [`IContainerContextDecl`](IContainerContextDecl.md) |
| <a id="metadata"></a> `metadata?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |
| <a id="resources"></a> `resources?` | `readonly` | readonly [`IImporterResourceDecl`](../type-aliases/IImporterResourceDecl.md)[] |
