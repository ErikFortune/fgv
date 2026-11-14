[Home](../../README.md) > [AiAssist](../README.md) > [IClientToolLoopOutcome](./IClientToolLoopOutcome.md) > orphanedRoundCalls

## IClientToolLoopOutcome.orphanedRoundCalls property

Present after `'aborted'` and `'deadline'` only: every call the round in flight at the stop had
handed off for dispatch, in order, settled or not. These are calls whose results the host never
received in a recorded round. Empty when that round had made no call (or the stop came before
any round started). See `IClientToolOrphanedCall`.

**Signature:**

```typescript
readonly orphanedRoundCalls: readonly IClientToolOrphanedCall[];
```
