[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IChildResourceCandidateDecl

# Interface: IChildResourceCandidateDecl

Non-validated child declaration of a [resource candidate](../../../../../classes/ResourceCandidate.md).

## Extended by

- [`IImporterResourceCandidateDecl`](IImporterResourceCandidateDecl.md)
- [`ILooseResourceCandidateDecl`](ILooseResourceCandidateDecl.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="conditions"></a> `conditions?` | `readonly` | [`ConditionSetDecl`](../type-aliases/ConditionSetDecl.md) | The conditions that must be met for the resource to be selected. |
| <a id="ispartial"></a> `isPartial?` | `readonly` | `boolean` | If true, the resource is only a partial representation of the full resource. |
| <a id="json"></a> `json` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON value of the resource. |
| <a id="mergemethod"></a> `mergeMethod?` | `readonly` | [`ResourceValueMergeMethod`](../../../../../type-aliases/ResourceValueMergeMethod.md) | The merge method to be used when merging the resource into the existing resource. default is 'augment'. |
