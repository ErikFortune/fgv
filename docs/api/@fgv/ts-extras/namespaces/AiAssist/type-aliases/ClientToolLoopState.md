[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / ClientToolLoopState

# Type Alias: ClientToolLoopState

> **ClientToolLoopState** = `"completed"` \| `"round-limit"` \| `"aborted"` \| `"deadline"`

How a `runClientToolLoop` loop ended, when it did not fail:
- `'completed'` — a round returned no continuation: the model finished.
- `'round-limit'` — `maxRounds` rounds ran and the model was still asking for tools.
- `'aborted'` — the caller's signal aborted.
- `'deadline'` — the loop's `deadlineMs` expired.
