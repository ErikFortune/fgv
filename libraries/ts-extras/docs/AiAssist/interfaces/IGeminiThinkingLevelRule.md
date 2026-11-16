[Home](../../README.md) > [AiAssist](../README.md) > IGeminiThinkingLevelRule

# Interface: IGeminiThinkingLevelRule

One entry in AiAssist.IAiProviderDescriptor.geminiThinkingLevels: a Gemini model controlled by
`thinkingLevel` rather than `thinkingBudget`, and the levels it accepts.

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

[modelPrefix](./IGeminiThinkingLevelRule.modelPrefix.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

A concrete model id, matched exact-or-dash-bounded.

</td></tr>
<tr><td>

[levels](./IGeminiThinkingLevelRule.levels.md)

</td><td>

`readonly`

</td><td>

readonly [GeminiThinkingLevel](../../type-aliases/GeminiThinkingLevel.md)[]

</td><td>

The levels the model accepts, lowest first.

</td></tr>
</tbody></table>
