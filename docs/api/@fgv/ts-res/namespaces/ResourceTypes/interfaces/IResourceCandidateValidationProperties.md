[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ResourceTypes](../README.md) / IResourceCandidateValidationProperties

# Interface: IResourceCandidateValidationProperties

Parameters used to validate a [resource candidate declaration](../../ResourceJson/namespaces/Json/interfaces/ILooseResourceCandidateDecl.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-completeness"></a> `completeness` | `public` | [`CandidateCompleteness`](../../../type-aliases/CandidateCompleteness.md) | Describes how complete the candidate value is. |
| <a id="property-id"></a> `id` | `public` | [`ResourceId`](../../../type-aliases/ResourceId.md) | The [id](../../../type-aliases/ResourceId.md) of the resource. |
| <a id="property-json"></a> `json` | `public` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value of the resource. |
| <a id="property-mergemethod"></a> `mergeMethod` | `public` | [`ResourceValueMergeMethod`](../../../type-aliases/ResourceValueMergeMethod.md) | The merge method to be used when merging the resource into the existing resource. default is 'augment'. |
