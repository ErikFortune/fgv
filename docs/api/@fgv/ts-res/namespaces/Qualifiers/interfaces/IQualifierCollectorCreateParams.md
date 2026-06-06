[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Qualifiers](../README.md) / IQualifierCollectorCreateParams

# Interface: IQualifierCollectorCreateParams

Parameters for creating a new [Qualifiers.QualifierCollector](../classes/QualifierCollector.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="qualifiers"></a> `qualifiers?` | [`IQualifierDecl`](IQualifierDecl.md)[] | Optional list of [declarations](IQualifierDecl.md) for the qualifiers to add to the collection upon creation. |
| <a id="qualifiertypes"></a> `qualifierTypes` | [`ReadOnlyQualifierTypeCollector`](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) | The [qualifier types](../../QualifierTypes/classes/QualifierTypeCollector.md) used to create [qualifiers](../../../classes/Qualifier.md) from [declarations](IQualifierDecl.md). |
