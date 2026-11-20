[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ISourceReconcilePage

# Interface: ISourceReconcilePage

One page of a source's reconciliation listing or, for a `source-replay` source, of its durable
ordered feed.

## Remarks

- `checkpoint` is the position *after* this page. The broker persists it — and passes it back as
  the next `cursor` — only once every observation in the page has committed.
- `nextCursor` is present when more pages are available now; the pass continues with it.
- `gap` says the source cannot supply part of what it owes. The broker stops the pass there
  without advancing its cursor.

For `source-replay`, a page's observations of one binding carry strictly increasing revisions;
duplicates of revisions the broker has already committed are safe and skipped.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-checkpoint"></a> `checkpoint?` | `readonly` | `string` |
| <a id="property-completeness"></a> `completeness` | `readonly` | `"gap"` \| `"complete"` \| `"partial"` |
| <a id="property-coverage"></a> `coverage` | `readonly` | [`SourceReconcileCoverage`](../type-aliases/SourceReconcileCoverage.md) |
| <a id="property-issues"></a> `issues` | `readonly` | readonly `string`[] |
| <a id="property-nextcursor"></a> `nextCursor?` | `readonly` | `string` |
| <a id="property-observations"></a> `observations` | `readonly` | readonly [`ISourceObservation`](ISourceObservation.md)[] |
