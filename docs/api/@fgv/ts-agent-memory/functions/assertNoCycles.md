[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / assertNoCycles

# Function: assertNoCycles()

> **assertNoCycles**(`existing`, `proposed`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

Write-time cycle guard. Given the graph's EXISTING directed edges plus a set of
PROPOSED edges, verify that adding the proposed edges keeps the union graph a
DAG. Fails loudly, naming the first proposed edge that would close a directed
cycle.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `existing` | readonly [`ICycleGuardEdge`](../interfaces/ICycleGuardEdge.md)[] |
| `proposed` | readonly [`ICycleGuardEdge`](../interfaces/ICycleGuardEdge.md)[] |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`true`\>

## Remarks

Distinct from the read-time BFS in `LinkTraversalRetriever` (which tolerates
cycles via a visited-set): this is a WRITE-time admission check. Cycle
detection is DFS reachability — a proposed `source -> target` edge closes a
cycle iff `target` already reaches `source` in the graph built so far. Proposed
edges are folded in one at a time (in order), so an intra-batch cycle
(`A->B`, `B->A` both proposed) is caught as well as a batch-vs-existing cycle.

See the design note §4: this enforces GLOBAL directed-acyclicity over all link
types (conservative — a mutual associative pair is rejected). Callers that need
mutual links disable the guard.
