[Home](../README.md) > IAiModelCapabilityConfig

# Interface: IAiModelCapabilityConfig

Configuration that maps model id patterns to capabilities. Used to
augment (or, where the provider supplies no capability info, fully
derive) the capability set for each listed model.

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

[perProvider](./IAiModelCapabilityConfig.perProvider.md)

</td><td>

`readonly`

</td><td>

{ copy-paste?: readonly [IAiModelCapabilityRule](IAiModelCapabilityRule.md)[]; xai-grok?: readonly [IAiModelCapabilityRule](IAiModelCapabilityRule.md)[]; openai?: readonly [IAiModelCapabilityRule](IAiModelCapabilityRule.md)[]; anthropic?: readonly [IAiModelCapabilityRule](IAiModelCapabilityRule.md)[]; google-gemini?: readonly [IAiModelCapabilityRule](IAiModelCapabilityRule.md)[]; groq?: readonly [IAiModelCapabilityRule](IAiModelCapabilityRule.md)[]; mistral?: readonly [IAiModelCapabilityRule](IAiModelCapabilityRule.md)[] }

</td><td>

Per-provider rules.

</td></tr>
<tr><td>

[global](./IAiModelCapabilityConfig.global.md)

</td><td>

`readonly`

</td><td>

readonly [IAiModelCapabilityRule](IAiModelCapabilityRule.md)[]

</td><td>

Cross-provider fallback rules.

</td></tr>
</tbody></table>
