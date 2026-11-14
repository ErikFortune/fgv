[Home](../README.md) > IThinkingConfig

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

"none" | "high" | "low" | "medium"

</td><td>

Cross-provider effort level.

</td></tr>
<tr><td>

[onUnsupported](./IThinkingConfig.onUnsupported.md)

</td><td>

`readonly`

</td><td>

"fail" | "degrade"

</td><td>

What to do when `effort` is `'none'` and the resolved model cannot run with thinking off
(see IAiProviderDescriptor.thinkingRequiredModelPrefixes).

</td></tr>
<tr><td>

[providers](./IThinkingConfig.providers.md)

</td><td>

`readonly`

</td><td>

readonly [IThinkingProviderConfig](../type-aliases/IThinkingProviderConfig.md)[]

</td><td>

Optional per-provider precision blocks.

</td></tr>
</tbody></table>
