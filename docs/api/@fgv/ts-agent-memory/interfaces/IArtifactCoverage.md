[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IArtifactCoverage

# Interface: IArtifactCoverage

How much of one derived artifact exists, for one [Kind](../type-aliases/Kind.md).

## Remarks

Two numbers rather than a percentage, deliberately: a ratio cannot express
*"nothing was expected"*, and a kind that is intentionally not derived (an
excluded kind, a kind with no projector) is a normal and healthy state that a
`0%` would render as an alarm.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-covered"></a> `covered` | `readonly` | `number` | Of those, how many the **store believes** are covered. See [IIndexCoverage.indexSize](IIndexCoverage.md#property-indexsize) for why the word "believes" is load-bearing. |
| <a id="property-expected"></a> `expected` | `readonly` | `number` | Records of this kind the store would derive this artifact for, **after** any exclusion. Read against [IDerivedStateCoverage.records](IDerivedStateCoverage.md#property-records) for the same kind: `records: 40, expected: 0` is the exclusion story, stated rather than inferred. |
