[Home](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > onBeforeToolExecute

## IExecuteClientToolTurnParams.onBeforeToolExecute property

Optional host gate invoked for each client-tool call **after** the model's raw
args have been validated against the tool's `parametersSchema` and **before**
`tool.execute(...)` runs. The full `tool` (including `tool.config.annotations`)
and the validated `args` are passed so gate logic can key off a tool's behavior
annotations (e.g. deny a `destructiveHint` call pending confirmation).

Returning `{ action: 'proceed' }` (or omitting the callback) runs `execute`
normally. Returning `{ action: 'deny', reason }` skips `execute` and synthesizes
a denial tool-result carrying `reason` into the continuation (the model sees the
denial and can react); **the turn continues**. A callback that returns `Result.fail`
or rejects is a hard error that **terminates the turn** (fails `nextTurn` + emits an
inline `error` event) — distinct from a `tool.execute` failure, which continues the
turn with an `isError` result. A deny must therefore be explicit.

**Signature:**

```typescript
readonly onBeforeToolExecute: (tool: IAiClientTool, args: unknown) => Promise<Result<IToolExecutionDecision>>;
```
