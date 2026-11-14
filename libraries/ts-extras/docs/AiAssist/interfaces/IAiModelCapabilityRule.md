[Home](../../README.md) > [AiAssist](../README.md) > IAiModelCapabilityRule

# Interface: IAiModelCapabilityRule

One rule in an IAiModelCapabilityConfig. Multiple rules can match
a single model — their capability arrays are unioned.

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

[idPattern](./IAiModelCapabilityRule.idPattern.md)

</td><td>

`readonly`

</td><td>

RegExp

</td><td>

RegExp tested against the model id (using `.test`).

</td></tr>
<tr><td>

[capabilities](./IAiModelCapabilityRule.capabilities.md)

</td><td>

`readonly`

</td><td>

readonly [AiModelCapability](../../type-aliases/AiModelCapability.md)[]

</td><td>

Capabilities this rule attributes to matching models.

</td></tr>
<tr><td>

[displayName](./IAiModelCapabilityRule.displayName.md)

</td><td>

`readonly`

</td><td>

string | ((id: string) =&gt; string)

</td><td>

Friendly display-name override for matching models.

</td></tr>
</tbody></table>
