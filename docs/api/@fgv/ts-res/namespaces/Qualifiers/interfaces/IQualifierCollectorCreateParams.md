[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Qualifiers](../README.md) / IQualifierCollectorCreateParams

# Interface: IQualifierCollectorCreateParams

Parameters for creating a new [Qualifiers.QualifierCollector](../classes/QualifierCollector.md).

## Remarks

`qualifiers` accepts a mixed array of bare axis-name strings and full
[declarations](IQualifierDecl.md). A string element is
sugar for "literal qualifier with this name"; the library synthesizes a
[LiteralQualifierType](../../QualifierTypes/classes/LiteralQualifierType.md) and a
declaration `{ name, typeName: name, defaultPriority: <descending> }`.

Synthesized priorities are distributed across the
`[MinConditionPriority..MaxConditionPriority]` range adaptively to the
array length: `step = max(1, floor((Max - Min) / length))`,
`priority = max(Min, Max - index * step)`. Earlier elements get higher
priority. The formula never overflows the `ConditionPriority` range
regardless of input length; for inputs whose length exceeds the range
cardinality (\>1000 axes), trailing priorities collapse at
`MinConditionPriority` — supply explicit priorities in that regime
if uniqueness matters.

`qualifierTypes` may be omitted only when every element of `qualifiers`
is a string. If any element is an [Qualifiers.IQualifierDecl](IQualifierDecl.md),
`qualifierTypes` must be supplied and must contain the referenced
[typeNames](IQualifierDecl.md#property-typename).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-qualifiers"></a> `qualifiers?` | readonly (`string` \| [`IQualifierDecl`](IQualifierDecl.md))[] | Optional list of [declarations](IQualifierDecl.md) or bare axis-name strings for the qualifiers to add to the collection on creation. **Remarks** A string element `'foo'` is sugar for a literal qualifier: `{ name: 'foo', typeName: 'foo', defaultPriority: <descending> }` backed by a synthesized [LiteralQualifierType](../../QualifierTypes/classes/LiteralQualifierType.md) named `'foo'`. |
| <a id="property-qualifiertypes"></a> `qualifierTypes?` | [`ReadOnlyQualifierTypeCollector`](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) | The [qualifier types](../../QualifierTypes/classes/QualifierTypeCollector.md) used to create [qualifiers](../../../classes/Qualifier.md) from [declarations](IQualifierDecl.md). Optional only when every entry in `qualifiers` is a bare axis-name string (in which case the library synthesizes a literal qualifier type per name). |
