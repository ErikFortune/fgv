[Home](../../README.md) > [AiAssist](../README.md) > IAnthropicThinkingConfig

# Interface: IAnthropicThinkingConfig

Anthropic-specific thinking configuration.

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

[effort](./IAnthropicThinkingConfig.effort.md)

</td><td>

`readonly`

</td><td>

"max" | "high" | "low" | "medium"

</td><td>

Anthropic effort level, emitted as one of **two** wire shapes chosen by
AiAssist.isAdaptiveThinkingModel:

- **Claude 5 family** (`claude-sonnet-5`, `claude-opus-5`, `claude-fable-5`
  — which includes the `base` and `advanced` tiers, so this is the default
  path): an adaptive `thinking` block plus an `output_config` block
  carrying `effort`.

</td></tr>
</tbody></table>
