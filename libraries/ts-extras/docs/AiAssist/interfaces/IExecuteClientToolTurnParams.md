[Home](../../README.md) > [AiAssist](../README.md) > IExecuteClientToolTurnParams

# Interface: IExecuteClientToolTurnParams

Parameters for AiAssist.executeClientToolTurn.

**Extends:** [`IChatRequest`](../../interfaces/IChatRequest.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[descriptor](./IExecuteClientToolTurnParams.descriptor.md)

</td><td>

`readonly`

</td><td>

[IAiProviderDescriptor](../../interfaces/IAiProviderDescriptor.md)

</td><td>

The provider descriptor for routing (Anthropic / OpenAI / Gemini).

</td></tr>
<tr><td>

[apiKey](./IExecuteClientToolTurnParams.apiKey.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

API key for authentication.

</td></tr>
<tr><td>

[continuationMessages](./IExecuteClientToolTurnParams.continuationMessages.md)

</td><td>

`readonly`

</td><td>

readonly JsonObject[]

</td><td>

The cumulative provider-native wire tail from the previous turn's
AiAssist.IAiClientToolContinuation.messages.

</td></tr>
<tr><td>

[temperature](./IExecuteClientToolTurnParams.temperature.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Sampling temperature.

</td></tr>
<tr><td>

[tools](./IExecuteClientToolTurnParams.tools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiWebSearchToolConfig](../../interfaces/IAiWebSearchToolConfig.md)[]

</td><td>

Server-side tools to include.

</td></tr>
<tr><td>

[clientTools](./IExecuteClientToolTurnParams.clientTools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiClientTool](../../interfaces/IAiClientTool.md)&lt;unknown&gt;[]

</td><td>

Client-defined tools available for the model to call.

</td></tr>
<tr><td>

[signal](./IExecuteClientToolTurnParams.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

Optional abort signal.

</td></tr>
<tr><td>

[endpoint](./IExecuteClientToolTurnParams.endpoint.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional override of the descriptor's default base URL.

</td></tr>
<tr><td>

[verifiedEndpoint](./IExecuteClientToolTurnParams.verifiedEndpoint.md)

</td><td>

`readonly`

</td><td>

[IAiVerifiedEndpoint](../../interfaces/IAiVerifiedEndpoint.md)

</td><td>

The host's assertion that `endpoint` reaches the descriptor's own provider, so this request's
schemas are adapted with that provider's keyword table instead of the conservative one.

</td></tr>
<tr><td>

[logger](./IExecuteClientToolTurnParams.logger.md)

</td><td>

`readonly`

</td><td>

ILogger

</td><td>

Optional logger for diagnostics.

</td></tr>
<tr><td>

[resolvedThinking](./IExecuteClientToolTurnParams.resolvedThinking.md)

</td><td>

`readonly`

</td><td>

[IResolvedThinkingConfig](../../interfaces/IResolvedThinkingConfig.md)

</td><td>

Optional resolved thinking config (pre-resolved by the caller).

</td></tr>
<tr><td>

[model](./IExecuteClientToolTurnParams.model.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Resolved model string (pre-resolved by the caller).

</td></tr>
<tr><td>

[onBeforeToolExecute](./IExecuteClientToolTurnParams.onBeforeToolExecute.md)

</td><td>

`readonly`

</td><td>

(tool: [IAiClientTool](../../interfaces/IAiClientTool.md), args: unknown) =&gt; Promise&lt;Result&lt;[IToolExecutionDecision](../../type-aliases/IToolExecutionDecision.md)&gt;&gt;

</td><td>

Optional host gate invoked for each client-tool call **after** the model's raw
args have been validated against the tool's `parametersSchema` and **before**
`tool.execute(...)` runs.

</td></tr>
<tr><td>

[maxTokens](./IExecuteClientToolTurnParams.maxTokens.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Optional cap on generated output tokens, mapped to each provider's native field:
Anthropic `max_tokens`, OpenAI/xAI Responses `max_output_tokens` (client-tool turns always
route OpenAI through the Responses API), Gemini `generationConfig.maxOutputTokens`.

</td></tr>
<tr><td>

[toolConflictPolicy](./IExecuteClientToolTurnParams.toolConflictPolicy.md)

</td><td>

`readonly`

</td><td>

[AiToolConflictPolicy](../../type-aliases/AiToolConflictPolicy.md)

</td><td>

What to do when this provider declares one of the requested server tools
mutually exclusive with client tools (see
AiAssist.IAiProviderDescriptor.serverToolsExclusiveWithClientTools).

</td></tr>
<tr><td>

[cache](./IExecuteClientToolTurnParams.cache.md)

</td><td>

`readonly`

</td><td>

[IAiCacheRequest](../../interfaces/IAiCacheRequest.md)

</td><td>

Prompt-caching plan for this request.

</td></tr>
<tr><td>

[clock](./IExecuteClientToolTurnParams.clock.md)

</td><td>

`readonly`

</td><td>

() =&gt; number

</td><td>

Monotonic clock in milliseconds that each call's `IAiClientToolCallSummary.durationMs` is
measured with.

</td></tr>
<tr><td>

[system](./IChatRequest.system.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

System instructions (schema docs, format rules, general guidance).

</td></tr>
<tr><td>

[messages](./IChatRequest.messages.md)

</td><td>

`readonly`

</td><td>

readonly [IChatMessage](../../interfaces/IChatMessage.md)[]

</td><td>

The ordered conversation turns.

</td></tr>
</tbody></table>
