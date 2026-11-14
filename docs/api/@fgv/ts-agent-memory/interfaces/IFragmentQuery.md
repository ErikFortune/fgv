[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFragmentQuery

# Interface: IFragmentQuery

A sub-document semantic-search request: the natural-language `semantic` text to
match, an optional `topK` result cap (default 10), and an optional
`maxPerRecord` cap that keeps one long document from monopolizing the result.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-entityid"></a> `entityId?` | `readonly` | [`EntityId`](../type-aliases/EntityId.md) | Narrow the search to one record's fragments: the consumer-supplied domain key of the record to search within. **Must be supplied with [IFragmentQuery.kind](#property-kind).** **Remarks** The narrowing is applied **during selection, before the `topK` cut**, so the `topK` you ask for is the `topK` you get. Filtering a global result afterwards is not equivalent: it truncates to `topK` across every record first, so a scoped search would come back short whenever other records outscored this one's fragments. For a versioned kind this narrows to **every version of the entity** — literally every version, superseded ones included, because invalidation stamps `invalid_at` without pruning that version's fragments. Nothing on a hit distinguishes a current fragment from a historical one. That matches the record-granular vector lane; it is not currency filtering. |
| <a id="property-kind"></a> `kind?` | `readonly` | [`Kind`](../type-aliases/Kind.md) | The kind of the record named by [IFragmentQuery.entityId](#property-entityid). **Must be supplied with it.** **Remarks** This is not decoration and not a filter: `kind` **selects the identity codec**, and the codec computes the storage address. An `EntityId` promises no uniqueness beyond a scope — the same id under two kinds is the ordinary case, not a pathological one — so without `kind` the resolution is ambiguous, and with it ambiguity is structurally impossible. |
| <a id="property-maxperrecord"></a> `maxPerRecord?` | `readonly` | `number` | Maximum number of fragments any single record may contribute to the result. Applied during selection (before the `topK` cut). Omit for uncapped. |
| <a id="property-semantic"></a> `semantic` | `readonly` | `string` | The natural-language text to embed and match against stored fragments. |
| <a id="property-topk"></a> `topK?` | `readonly` | `number` | Maximum number of fragment hits to return. Defaults to 10. |
