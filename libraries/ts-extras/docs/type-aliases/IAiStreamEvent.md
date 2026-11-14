[Home](../README.md) > IAiStreamEvent

# Type Alias: IAiStreamEvent

Discriminated union of events emitted by a streaming completion.

## Type

```typescript
type IAiStreamEvent = IAiStreamTextDelta | IAiStreamToolEvent | IAiStreamToolUseStart | IAiStreamToolUseDelta | IAiStreamToolUseComplete | IAiStreamDone | IAiStreamError
```
