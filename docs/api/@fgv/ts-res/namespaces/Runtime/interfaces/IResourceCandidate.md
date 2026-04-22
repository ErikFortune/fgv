[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / IResourceCandidate

# Interface: IResourceCandidate

Runtime representation of a resource candidate with the minimal data needed for resolution.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="ispartial"></a> `isPartial` | `readonly` | `boolean` | Indicates if this candidate is a partial resource. |
| <a id="json"></a> `json` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The JSON value for this candidate |
| <a id="mergemethod"></a> `mergeMethod` | `readonly` | [`ResourceValueMergeMethod`](../../../type-aliases/ResourceValueMergeMethod.md) | Specifies the resource type of this candidate. |
