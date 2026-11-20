[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / IChildResourceCandidateDecl

# Interface: IChildResourceCandidateDecl\<TQualifierNames\>

Non-validated child declaration of a [resource candidate](../../../../../classes/ResourceCandidate.md).

## Remarks

Parameterized on `TQualifierNames` so the `conditions` field can carry a
narrowed axis-name set. Defaults to `string` so existing untyped callers
compile unchanged.

## Extended by

- [`IImporterResourceCandidateDecl`](IImporterResourceCandidateDecl.md)
- [`ILooseResourceCandidateDecl`](ILooseResourceCandidateDecl.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-conditions"></a> `conditions?` | `readonly` | [`ConditionSetDecl`](../type-aliases/ConditionSetDecl.md)\<`TQualifierNames`\> | The conditions that must be met for the resource to be selected. |
| <a id="property-ispartial"></a> `isPartial?` | `readonly` | `boolean` | If true, the resource is only a partial representation of the full resource. |
| <a id="property-json"></a> `json` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON value of the resource. |
| <a id="property-mergemethod"></a> `mergeMethod?` | `readonly` | [`ResourceValueMergeMethod`](../../../../../type-aliases/ResourceValueMergeMethod.md) | The merge method to be used when merging the resource into the existing resource. default is 'augment'. |
