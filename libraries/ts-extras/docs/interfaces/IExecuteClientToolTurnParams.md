[Home](../README.md) > IExecuteClientToolTurnParams

# Interface: IExecuteClientToolTurnParams

Parameters for AiAssist.executeClientToolTurn.

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

[IAiProviderDescriptor](IAiProviderDescriptor.md)

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

[prompt](./IExecuteClientToolTurnParams.prompt.md)

</td><td>

`readonly`

</td><td>

[AiPrompt](../classes/AiPrompt.md)

</td><td>

The structured prompt.

</td></tr>
<tr><td>

[messagesBefore](./IExecuteClientToolTurnParams.messagesBefore.md)

</td><td>

`readonly`

</td><td>

readonly [IChatMessage](IChatMessage.md)[]

</td><td>

Prior conversation history (excluding the current turn).

</td></tr>
<tr><td>

[continuationMessages](./IExecuteClientToolTurnParams.continuationMessages.md)

</td><td>

`readonly`

</td><td>

readonly JsonObject[]

</td><td>

Provider-specific continuation messages to append after the prompt's user
message.

</td></tr>
<tr><td>

[temperature](./IExecuteClientToolTurnParams.temperature.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Temperature (default: 0.7).

</td></tr>
<tr><td>

[tools](./IExecuteClientToolTurnParams.tools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiWebSearchToolConfig](IAiWebSearchToolConfig.md)[]

</td><td>

Server-side tools to include.

</td></tr>
<tr><td>

[clientTools](./IExecuteClientToolTurnParams.clientTools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiClientTool](IAiClientTool.md)&lt;unknown&gt;[]

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

[IResolvedThinkingConfig](IResolvedThinkingConfig.md)

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
</tbody></table>
