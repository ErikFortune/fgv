[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / ICandidateValueCollectorCreateParams

# Interface: ICandidateValueCollectorCreateParams

Parameters for creating a [Resources.CandidateValueCollector](../classes/CandidateValueCollector.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="candidatevalues"></a> `candidateValues?` | ([`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) \| [`CandidateValue`](../classes/CandidateValue.md))[] | Optional initial candidate values to add to the collection. |
| <a id="normalizer"></a> `normalizer?` | [`HashingNormalizer`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional normalizer to use for normalizing JSON values. If not provided, a default Crc32Normalizer will be used. |
