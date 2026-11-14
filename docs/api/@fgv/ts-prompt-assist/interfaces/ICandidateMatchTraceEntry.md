[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / ICandidateMatchTraceEntry

# Interface: ICandidateMatchTraceEntry

Per-candidate match disposition recorded in the trace.

## Remarks

Order is specificity-ascending: full base first, most-specific partial
last (matches the join order for partial-fragment composition).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-candidateindex"></a> `candidateIndex` | `readonly` | `number` | Index into the record's `candidates` array (authored order). |
| <a id="property-conditions"></a> `conditions` | `readonly` | readonly [`IConditionMatchResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] | ts-res's per-condition match details, forwarded unchanged. |
| <a id="property-matchtype"></a> `matchType` | `readonly` | `"match"` \| `"matchAsDefault"` | ts-res's match disposition for the candidate's condition set. |
