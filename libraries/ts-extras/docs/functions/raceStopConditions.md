[Home](../README.md) > raceStopConditions

# Function: raceStopConditions

Runs `work` under an optional deadline and an optional caller signal, and settles with whichever
comes first: the work's own result, or a stop.

## Signature

```typescript
function raceStopConditions(work: (signal: AbortSignal) => Promise<Result<T>>, conditions: IStopConditions): AsyncDetailedResult<T, StopDetail>
```
