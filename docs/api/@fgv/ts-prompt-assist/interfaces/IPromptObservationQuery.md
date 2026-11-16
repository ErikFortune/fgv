[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptObservationQuery

# Interface: IPromptObservationQuery

Query criteria for [PromptObservationStore.query](../classes/PromptObservationStore.md#query). All supplied
criteria are AND-combined.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-filter"></a> `filter?` | `readonly` | (`record`) => `boolean` | Arbitrary escape-hatch predicate, applied after all other criteria. |
| <a id="property-hassafeguardfindings"></a> `hasSafeguardFindings?` | `readonly` | `boolean` | Only records that carry (or do not carry) any safeguard findings. |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | Return at most this many records — the most-recent N, still oldest-first. |
| <a id="property-outcome"></a> `outcome?` | `readonly` | `"success"` \| `"failure"` | Only records with this outcome. |
| <a id="property-outputkind"></a> `outputKind?` | `readonly` | [`PromptObservationOutputKind`](../type-aliases/PromptObservationOutputKind.md) | Only success resolve records with this `output.kind`. |
| <a id="property-phase"></a> `phase?` | `readonly` | [`PromptObservationPhase`](../type-aliases/PromptObservationPhase.md) | Only records of this phase. |
| <a id="property-promptid"></a> `promptId?` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | Only records for this prompt id. |
| <a id="property-qualifiers"></a> `qualifiers?` | `readonly` | `Readonly`\<`Partial`\<`Record`\<`string`, `string`\>\>\> | Partial qualifier match: matched via the store's injected [IQualifierResolver](IQualifierResolver.md). The default resolver does naive string equality on the supplied (defined) axes — entries with `undefined` values are skipped (no constraint on that axis). Production deployments needing ts-res-equivalent similarity matching (e.g. BCP47 language-tag matches) inject their own resolver at store creation time. |
| <a id="property-safeguarddisposition"></a> `safeguardDisposition?` | `readonly` | [`SafeguardDisposition`](../type-aliases/SafeguardDisposition.md) | Only records carrying at least one safeguard finding with this disposition. |
| <a id="property-scope"></a> `scope?` | `readonly` | [`ScopeKey`](../type-aliases/ScopeKey.md) | Only records whose resolve won at this scope OR whose request chain includes it. |
| <a id="property-since"></a> `since?` | `readonly` | `number` | Only records with `timestamp >= since`. |
| <a id="property-sinceseq"></a> `sinceSeq?` | `readonly` | `number` | Only records with `seq > sinceSeq` (incremental paging cursor). |
| <a id="property-until"></a> `until?` | `readonly` | `number` | Only records with `timestamp <= until`. |
