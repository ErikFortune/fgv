[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IImporterResourceCandidateDecl

# Interface: IImporterResourceCandidateDecl

Non-validated declaration of a resource candidate for import,
which can be either a loose or child resource candidate.

## Extends

- [`IChildResourceCandidateDecl`](IChildResourceCandidateDecl.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="conditions"></a> `conditions?` | `readonly` | [`ConditionSetDecl`](../type-aliases/ConditionSetDecl.md) | The conditions that must be met for the resource to be selected. |
| <a id="id"></a> `id?` | `readonly` | `string` | The [id](../../../../../type-aliases/ResourceId.md) of the resource. |
| <a id="ispartial"></a> `isPartial?` | `readonly` | `boolean` | If true, the resource is only a partial representation of the full resource. |
| <a id="json"></a> `json` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON value of the resource. |
| <a id="mergemethod"></a> `mergeMethod?` | `readonly` | [`ResourceValueMergeMethod`](../../../../../type-aliases/ResourceValueMergeMethod.md) | The merge method to be used when merging the resource into the existing resource. default is 'augment'. |
| <a id="resourcetypename"></a> `resourceTypeName?` | `readonly` | `string` | The name of the type of this resource. |
