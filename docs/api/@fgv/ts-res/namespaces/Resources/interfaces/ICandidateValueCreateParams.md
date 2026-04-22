[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / ICandidateValueCreateParams

# Interface: ICandidateValueCreateParams

Parameters for creating a [CandidateValue](../classes/CandidateValue.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="index"></a> `index?` | `number` | Optional index if the value is already indexed. |
| <a id="json"></a> `json` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | The JSON value to store. Will be normalized during creation. |
| <a id="normalizer"></a> `normalizer?` | [`Crc32Normalizer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional normalizer to use for normalizing the JSON value. If not provided, a default Crc32Normalizer will be used. |
