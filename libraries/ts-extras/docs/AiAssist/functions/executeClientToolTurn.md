[Home](../../README.md) > [AiAssist](../README.md) > executeClientToolTurn

# Function: executeClientToolTurn

Orchestrates a single client-tool streaming turn for any supported provider.

Starts a streaming request, iterates the underlying provider stream, and:
- Forwards `text-delta`, `tool-event`, `client-tool-call-start`, and
  `client-tool-call-done` events through to the consumer.
- For each `client-tool-call-done` event: validates the raw args against the
  tool's `parametersSchema`, invokes `execute(typedArgs)`, and emits a
  `client-tool-result` event.
- After stream completion: builds the per-provider continuation (or
  `{ continuation: undefined }` when no tool calls occurred) and resolves
  `nextTurn`.

**Anthropic constraint (E3):** The continuation for Anthropic does not set
a forced `tool_choice`. Only `tool_choice: 'auto'` (the default, i.e.
omitted) is compatible with extended thinking.

## Signature

```typescript
function executeClientToolTurn(params: IExecuteClientToolTurnParams): Result<IExecuteClientToolTurnResult>
```
