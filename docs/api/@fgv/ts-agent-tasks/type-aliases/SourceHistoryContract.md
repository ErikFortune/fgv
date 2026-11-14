[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / SourceHistoryContract

# Type Alias: SourceHistoryContract

> **SourceHistoryContract** = `"observed-state"` \| `"source-replay"`

The history contract a source offers.

## Remarks

`observed-state` promises the latest snapshot only — it cannot supply intermediate
events it has discarded. `source-replay` promises an ordered feed of required
updates, and under A3 must additionally declare a *finite* remaining envelope
(see [ISourceReplayEnvelope](../interfaces/ISourceReplayEnvelope.md)) before its stronger guarantee is admitted.
