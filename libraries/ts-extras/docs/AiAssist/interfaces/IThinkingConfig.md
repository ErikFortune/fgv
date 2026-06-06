[Home](../../README.md) > [AiAssist](../README.md) > IThinkingConfig

# Interface: IThinkingConfig

Thinking/reasoning mode configuration for a completion request.

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

[effort](./IThinkingConfig.effort.md)

</td><td>

`readonly`

</td><td>

"high" | "low" | "medium"

</td><td>

Cross-provider effort level.

</td></tr>
<tr><td>

[providers](./IThinkingConfig.providers.md)

</td><td>

`readonly`

</td><td>

readonly [IThinkingProviderConfig](../../type-aliases/IThinkingProviderConfig.md)[]

</td><td>

Optional per-provider precision blocks.

</td></tr>
</tbody></table>
