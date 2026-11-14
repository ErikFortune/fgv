[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IFragmentLocator

# Interface: IFragmentLocator

A half-open `[start, end)` span into a record's body — the in-record locator a
[IFragmentVectorIndex](IFragmentVectorIndex.md) may carry on a fragment. `start` is inclusive,
`end` exclusive. The unit (character / byte / token offsets) is the consumer's
choice: the index stores the two integers opaquely and never interprets them,
so they line up with whatever locator the consumer's own read side uses.

## Remarks

**The span is advisory.** It names the region of the body a fragment was
*derived from*; it is NOT a slice guaranteed to reproduce the fragment's text.
`body.slice(start, end)` round-trips only under a segmenter that merely chooses
boundaries. Under a **rewriting** segmenter — one that turns a span into a
curated block, an increasingly common ingestion shape when a model both selects
and rewrites — the fragment text is not a substring of the body at all, and the
fragmentation is not re-derivable from the body. Treat the span as a pointer for
locating context, never as an extraction recipe.

A fragment whose provenance cannot honestly be expressed as a body span should
omit the locator entirely and carry an [IEmbeddedFragment.fragmentId](IEmbeddedFragment.md#property-fragmentid)
instead.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-end"></a> `end` | `readonly` | `number` | Exclusive end offset into the record body. |
| <a id="property-start"></a> `start` | `readonly` | `number` | Inclusive start offset into the record body. |
