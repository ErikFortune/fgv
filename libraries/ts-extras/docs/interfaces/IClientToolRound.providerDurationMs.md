[Home](../README.md) > [IClientToolRound](./IClientToolRound.md) > providerDurationMs

## IClientToolRound.providerDurationMs property

The round's elapsed time on the loop's clock minus the sum of its calls' `durationMs`, floored
at zero. Everything that is not tool time counts — the provider, and also the time spent in
synchronous `observer.event` hooks during the drain.

**Signature:**

```typescript
readonly providerDurationMs: number;
```
