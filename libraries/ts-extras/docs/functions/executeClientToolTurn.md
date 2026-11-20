[Home](../README.md) > executeClientToolTurn

# Function: executeClientToolTurn

Orchestrates a single client-tool streaming turn for any supported provider.

Starts a streaming request, iterates the underlying provider stream, and:
- Forwards `text-delta`, `tool-event`, `client-tool-call-start`, and
  `client-tool-call-done` events through to the consumer.
- For each `client-tool-call-done` event: validates the raw args against the
  tool's `parametersSchema`, consults `onBeforeToolExecute`, invokes
  `execute(typedArgs)`, and emits a `client-tool-result` event. The call's
  `durationMs` is measured around that dispatch.

**No dispatch after abort.** `signal` is checked before the gate and again
before `execute`, so once it has aborted no tool starts: the call still gets
its `client-tool-call-done` / `client-tool-result` pair, with an `isError`
result saying the turn was aborted. A tool already running is handed the
signal and may stop early; one that ignores it runs to completion.
- After stream completion: builds the per-provider continuation (or
  `{ continuation: undefined }` when no tool calls occurred) and resolves
  `nextTurn`.

**Anthropic constraint (E3):** The continuation for Anthropic does not set
a forced `tool_choice`. Only `tool_choice: 'auto'` (the default, i.e.
omitted) is compatible with extended thinking.

**Provider tool exclusions:** when the descriptor declares a server tool
mutually exclusive with client tools (today only Gemini, for `web_search`),
`toolConflictPolicy` decides — by default the server tool is dropped and the
turn proceeds. The turn result's `toolConflicts` always says what happened, so
a host can tell the person that e.g. web search was unavailable this turn.
Pass `'fail'` to refuse the request up front instead.

**Schema pre-flight:** every client tool offered this turn has its parameter schema adapted for
the target wire (`descriptor.apiFormat`, the model, and the endpoint as `endpoint` /
`verifiedEndpoint` describe it) before anything is sent. A schema that wire cannot carry — a
node with no `type` where the wire's table refuses one — makes this return a `Failure` naming the
tool, the JSON Pointer path and the wire, with no request made; it is never reported as a stream
`error` event.

## Signature

```typescript
function executeClientToolTurn(params: IExecuteClientToolTurnParams): Result<IExecuteClientToolTurnResult>
```
