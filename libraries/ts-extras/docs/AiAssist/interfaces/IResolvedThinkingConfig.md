[Home](../../README.md) > [AiAssist](../README.md) > IResolvedThinkingConfig

# Interface: IResolvedThinkingConfig

Resolved thinking wire parameters for a specific provider, after merging
all applicable config blocks. Ready for provider-specific wire encoding.

Callers that pre-resolve thinking config outside of the standard streaming
helpers (e.g. `executeClientToolTurn`) accept this type via the
`resolvedThinking` parameter and pass it directly to the adapter layer.

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

[anthropicEffort](./IResolvedThinkingConfig.anthropicEffort.md)

</td><td>

`readonly`

</td><td>

"max" | "high" | "low" | "medium"

</td><td>

Anthropic: effort level; emit-site converts to `thinking.budget_tokens` via `anthropicEffortToBudgetTokens`.

</td></tr>
<tr><td>

[openAiEffort](./IResolvedThinkingConfig.openAiEffort.md)

</td><td>

`readonly`

</td><td>

"none" | "high" | "low" | "medium" | "minimal" | "xhigh"

</td><td>

OpenAI Chat: reasoning_effort value; OpenAI Responses: reasoning.effort

</td></tr>
<tr><td>

[geminiThinkingBudget](./IResolvedThinkingConfig.geminiThinkingBudget.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gemini: generationConfig.thinkingConfig.thinkingBudget

</td></tr>
<tr><td>

[xaiEffort](./IResolvedThinkingConfig.xaiEffort.md)

</td><td>

`readonly`

</td><td>

"none" | "high" | "low" | "medium"

</td><td>

xAI: reasoning_effort value (omit for grok-4)

</td></tr>
<tr><td>

[otherParams](./IResolvedThinkingConfig.otherParams.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

Other/passthrough: merged verbatim into wire request

</td></tr>
</tbody></table>
