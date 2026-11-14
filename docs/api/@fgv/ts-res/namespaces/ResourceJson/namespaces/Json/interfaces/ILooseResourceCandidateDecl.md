[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Json](../README.md) / ILooseResourceCandidateDecl

# Interface: ILooseResourceCandidateDecl\<TQualifierNames\>

Non-validated loose declaration of a [resource candidate](../../../../../classes/ResourceCandidate.md).

## Remarks

Parameterized on `TQualifierNames`; inherits via `IChildResourceCandidateDecl`.
Defaults to `string` for back-compat.

## Extends

- [`IChildResourceCandidateDecl`](IChildResourceCandidateDecl.md)\<`TQualifierNames`\>

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-conditions"></a> `conditions?` | `readonly` | [`ConditionSetDecl`](../type-aliases/ConditionSetDecl.md)\<`TQualifierNames`\> | The conditions that must be met for the resource to be selected. |
| <a id="property-id"></a> `id` | `readonly` | `string` | The [id](../../../../../type-aliases/ResourceId.md) of the resource. |
| <a id="property-ispartial"></a> `isPartial?` | `readonly` | `boolean` | If true, the resource is only a partial representation of the full resource. |
| <a id="property-json"></a> `json` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON value of the resource. |
| <a id="property-mergemethod"></a> `mergeMethod?` | `readonly` | [`ResourceValueMergeMethod`](../../../../../type-aliases/ResourceValueMergeMethod.md) | The merge method to be used when merging the resource into the existing resource. default is 'augment'. |
| <a id="property-resourcetypename"></a> `resourceTypeName?` | `readonly` | `string` | The type of the resource. |
