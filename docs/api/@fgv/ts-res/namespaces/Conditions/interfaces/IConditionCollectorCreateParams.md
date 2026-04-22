[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Conditions](../README.md) / IConditionCollectorCreateParams

# Interface: IConditionCollectorCreateParams

Parameters for creating a [ConditionCollector](../classes/ConditionCollector.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="conditions"></a> `conditions?` | [`ILooseConditionDecl`](../../ResourceJson/namespaces/Json/interfaces/ILooseConditionDecl.md)[] | Optional array of condition declarations to add to the collector. |
| <a id="qualifiers"></a> `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [ReadOnlyQualifierCollector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) used to create conditions in this collector. |
