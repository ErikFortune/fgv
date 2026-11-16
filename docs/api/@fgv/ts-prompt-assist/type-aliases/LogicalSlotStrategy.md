[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / LogicalSlotStrategy

# Type Alias: LogicalSlotStrategy

> **LogicalSlotStrategy** = `"concatenate"` \| `"overwrite"`

Strategy for merging multiple contributors' non-constraint values for one
logical slot. `'concatenate'` joins all contributions (ascending provenance)
with the slot's separator; `'overwrite'` keeps the highest-provenance
contribution and discards the rest.

## Remarks

`constraint`-directive contributions are exempt from `'overwrite'` — they are
always concatenated and never dropped (see [HorizontalComposer](../classes/HorizontalComposer.md)).
A future model-synthesis (`'rewrite'`) strategy is deliberately not precluded
by this union.
