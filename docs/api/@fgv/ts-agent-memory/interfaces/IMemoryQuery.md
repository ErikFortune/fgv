[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryQuery

# Interface: IMemoryQuery

A retrieval query. Every field is optional; an empty query is the "recency
over everything" request. `semantic` and `asOf` are present from day one (the
no-resignature guarantee): a backend that adds semantic or temporal recall
sets the matching capability flag, with no interface change.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `number` | As-of epoch ms for temporal "valid at" queries. If set and the retriever's `supportsTemporalQuery` is `false`, the retriever returns a loud `Result.fail` — never a silent empty. |
| <a id="property-filter"></a> `filter?` | `readonly` | (`record`) => `boolean` | Arbitrary predicate applied after the scope / kind / tag / provenance-source pre-filter. |
| <a id="property-hops"></a> `hops?` | `readonly` | `number` | BFS hop count for link traversal. Default: 1. |
| <a id="property-kind"></a> `kind?` | `readonly` | [`Kind`](../type-aliases/Kind.md) | Restrict to records of this kind — the single-kind shorthand for [kinds](#property-kinds). When both are set they compose as AND (the record's kind must satisfy both), so `kind` must itself be a member of `kinds` for anything to match. |
| <a id="property-kinds"></a> `kinds?` | `readonly` | readonly [`Kind`](../type-aliases/Kind.md)[] | Restrict to records in ANY of these kinds — the general (multi-kind) form of [kind](#property-kind). Absent → no kind-set constraint (today's behavior). An explicit empty array `[]` matches NOTHING (mirroring the non-positive-`limit` "explicit empty" convention), never "match all". |
| <a id="property-limit"></a> `limit?` | `readonly` | `number` | Maximum records to return. Applied after all other filters. |
| <a id="property-linkedfrom"></a> `linkedFrom?` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | Restrict to records linked FROM this scope-qualified seed (outbound). |
| <a id="property-linkedto"></a> `linkedTo?` | `readonly` | [`IEdgeTarget`](IEdgeTarget.md) | Restrict to records linked TO this scope-qualified seed (inbound / backlinks). |
| <a id="property-offset"></a> `offset?` | `readonly` | `number` | Records to skip after ordering, before `limit` — so `{ offset, limit }` is a stable page window over the ordered result set. Default 0. A non-positive or absent offset is today's behavior (no skip); an offset past the end yields an empty page, never a throw. |
| <a id="property-orderby"></a> `orderBy?` | `readonly` | `"rank"` \| `"recency"` | Ordering for the result set. `'recency'` (the default when absent — today's exact behavior) orders most-recently-updated first; `'rank'` orders by the store-computed [IMemoryEnvelope.rank](IMemoryEnvelope.md#property-rank) descending (records with an absent `rank` last), with recency as the tiebreak. Combined with `{ limit, offset }` this yields a bounded top-M rank-ordered page with no full-vault scan. **Remarks** `orderBy` governs the ordered non-semantic retrievers (recency / tag / structured-filter / link-traversal) and the [HybridRetriever](../classes/HybridRetriever.md)'s post-merge ordering. The [SemanticRetriever](../classes/SemanticRetriever.md) is the sole exception: it preserves its native vector-similarity order regardless of `orderBy` — re-sorting semantic hits by `rank` would discard the similarity ranking that is the whole point of that path; a consumer that wants rank ordering uses a non-semantic query. |
| <a id="property-provenancesource"></a> `provenanceSource?` | `readonly` | [`ProvenanceSource`](../type-aliases/ProvenanceSource.md) | Restrict to records whose [provenance.source](IProvenance.md#property-source) is exactly this value — the "show me everything this source produced" axis, for review, attribution, and retraction after a bad ingest. **Remarks** Exact match on `source` only, deliberately: not a subset match over the whole [IProvenance](IProvenance.md) block, not a presence check, and not a match on `by` / `model` / the consumer-owned extension keys. `source` is the only field of that block the library assigns meaning to, and every record carries one (`envelope.provenance` is required), so this axis is total — it partitions the vault rather than filtering out records that merely omit a field. Applied in the shared pre-filter alongside `scope` / `kind` / `tag`, so every retriever honours it and combining axes composes as AND. |
| <a id="property-scope"></a> `scope?` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | Restrict to records in this scope. |
| <a id="property-semantic"></a> `semantic?` | `readonly` | `string` | Text query for semantic / vector recall. If set and the retriever's `supportsSemanticRecall` is `false`, the retriever returns a loud `Result.fail` ([SEMANTIC\_UNWIRED\_MESSAGE](../variables/SEMANTIC_UNWIRED_MESSAGE.md)) — never a silent empty. |
| <a id="property-tag"></a> `tag?` | `readonly` | [`Tag`](../type-aliases/Tag.md) | Restrict to records carrying this tag (exact match). |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | Top-K for semantic recall. Default: 10. |
