[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiStreamEvent

# Type Alias: IAiStreamEvent

> **IAiStreamEvent** = [`IAiStreamTextDelta`](../interfaces/IAiStreamTextDelta.md) \| [`IAiStreamToolEvent`](../interfaces/IAiStreamToolEvent.md) \| [`IAiStreamToolUseStart`](../interfaces/IAiStreamToolUseStart.md) \| [`IAiStreamToolUseDelta`](../interfaces/IAiStreamToolUseDelta.md) \| [`IAiStreamToolUseComplete`](../interfaces/IAiStreamToolUseComplete.md) \| [`IAiStreamDone`](../interfaces/IAiStreamDone.md) \| [`IAiStreamError`](../interfaces/IAiStreamError.md)

Discriminated union of events emitted by a streaming completion.

## Remarks

**Exhaustive-switch consumers must handle all variants.** The three
`client-tool-*` variants were added when client-tool support shipped;
update every exhaustive switch over this union in lockstep.
