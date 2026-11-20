[Home](../../README.md) > [AiAssist](../README.md) > runClientToolLoop

# Function: runClientToolLoop

Drives a multi-round client-tool conversation over `executeClientToolTurn`: call the provider,
let the model request tools (dispatched while the round's stream is drained), feed the results
back through the continuation, and repeat until the model stops, the round cap is reached, the
caller aborts, or the deadline expires.

## Signature

```typescript
function runClientToolLoop(params: IClientToolLoopParams): AsyncDetailedResult<IClientToolLoopOutcome, IClientToolLoopFailureDetail>
```
