[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Conditions](../README.md) / IConditionSetCollectorCreateParams

# Interface: IConditionSetCollectorCreateParams

Parameters for creating a [ConditionSetCollector](../classes/ConditionSetCollector.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-conditions"></a> `conditions` | [`ConditionCollector`](../classes/ConditionCollector.md) | The [ConditionCollector](../classes/ConditionCollector.md) used to create conditions for conditions in this collector. |
| <a id="property-conditionsets"></a> `conditionSets?` | [`IConditionSetDecl`](IConditionSetDecl.md)\<`string`\>[] | Optional array of [condition set declarations](IConditionSetDecl.md) to add to the collector. |
