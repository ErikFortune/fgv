[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Compiled](../README.md) / ICompiledResourceCollection

# Interface: ICompiledResourceCollection

Represents a complete compiled collection of resources with their associated
qualifiers, types, conditions, and decisions.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="candidatevalues"></a> `candidateValues` | readonly [`JsonValue`](../../../../../../ts-res-ui-components/type-aliases/JsonValue.md)[] | Array of all candidate values in the collection. |
| <a id="conditions"></a> `conditions` | readonly [`ICompiledCondition`](ICompiledCondition.md)[] | Array of all conditions in the collection. |
| <a id="conditionsets"></a> `conditionSets` | readonly [`ICompiledConditionSet`](ICompiledConditionSet.md)[] | Array of all condition sets in the collection. |
| <a id="decisions"></a> `decisions` | readonly [`ICompiledAbstractDecision`](ICompiledAbstractDecision.md)[] | Array of all decisions in the collection. |
| <a id="qualifiers"></a> `qualifiers` | readonly [`ICompiledQualifier`](ICompiledQualifier.md)[] | Array of all qualifiers in the collection. |
| <a id="qualifiertypes"></a> `qualifierTypes` | readonly [`ICompiledQualifierType`](ICompiledQualifierType.md)[] | Array of all qualifier types in the collection. |
| <a id="resources"></a> `resources` | readonly [`ICompiledResource`](ICompiledResource.md)[] | Array of all resources in the collection. |
| <a id="resourcetypes"></a> `resourceTypes` | readonly [`ICompiledResourceType`](ICompiledResourceType.md)[] | Array of all resource types in the collection. |
