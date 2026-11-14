[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiClientToolTurnResult

# Interface: IAiClientToolTurnResult

The result of a single client-tool turn: the optional continuation for the next
call (absent when no tool calls occurred) and whether the stream was truncated.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-continuation"></a> `continuation` | `readonly` | [`IAiClientToolContinuation`](IAiClientToolContinuation.md) \| `undefined` | The continuation data for the next round-trip. `undefined` when the model completed without invoking any client tools. |
| <a id="property-fulltext"></a> `fullText` | `readonly` | `string` | The full concatenated text from all `text-delta` events in this turn. |
| <a id="property-toolconflicts"></a> `toolConflicts` | `readonly` | [`IAiToolConflictReport`](IAiToolConflictReport.md) | What the provider tool-conflict resolution did to this turn's tools. Always present; empty arrays mean nothing conflicted. **Remarks** Read this to tell the person (or the model, on a later turn) that a capability they expected was unavailable — e.g. that web search was dropped because the pinned model cannot ground and call functions in one request. |
| <a id="property-truncated"></a> `truncated` | `readonly` | `boolean` | Whether the stream was truncated (token limit or stop reason). |
| <a id="property-usage"></a> `usage?` | `readonly` | [`IAiCompletionUsage`](IAiCompletionUsage.md) | Token usage for this turn's provider call, when the provider reports it. **Remarks** The same `IAiCompletionUsage` the plain completion paths carry — normalized cache reads/writes, output and total input tokens, and a `reports` level saying which of those the provider is able to tell you. Sourced from the terminal `done` event of the underlying stream, so it is exactly what a caller watching `events` would see. Reading it here spares you *inspecting* the event stream, not *driving* it: `nextTurn` only resolves once `events` has been iterated to completion, the same as every other field on this interface. **One call, one usage.** `executeClientToolTurn` makes a single provider call per invocation; the multi-round loop is driven by the caller re-invoking with `continuationMessages`. So each result's `usage` already *is* one round's usage, and a host accumulating a per-turn total sums the results of its own loop. There is deliberately no `perRound` array here — it could only ever have one entry. **Optional on purpose, unlike `toolConflicts`.** The library always knows what it did to your tools, so a silent `toolConflicts` would be a defect and it is required. It cannot always know what a turn cost, so a required `usage` could only be satisfied by inventing one — the exact failure [AiAssist.IAiCompletionUsage.reports](IAiCompletionUsage.md#property-reports) exists to prevent. Absent means **no normalized usage is being exposed**, which covers two cases, the same as on [AiAssist.IAiCompletionResponse.usage](IAiCompletionResponse.md#property-usage) and [AiAssist.IAiStreamDone.usage](IAiStreamDone.md#property-usage): - the provider reported nothing; or - the provider reported something the library declines to normalize, because this descriptor is outside [AiAssist.supportsCacheUsageReporting](../functions/supportsCacheUsageReporting.md). Groq, Mistral, Ollama and self-hosted `openai-compat` share the OpenAI-format adapter but have unverified usage shapes, so a raw `usage` block from one of them is dropped rather than stamped with a cache-reporting level it may not have earned. Either way it is never a fabricated zero. If you need to tell the two apart, the descriptor answers it: the second case is a property of the provider you picked, not of the turn. |
