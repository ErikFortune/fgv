[Home](../../README.md) > [AiAssist](../README.md) > IAiToolAnnotations

# Interface: IAiToolAnnotations

Behavior annotations for a client-defined tool.

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

[title](./IAiToolAnnotations.title.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional human-readable display title for the tool.

</td></tr>
<tr><td>

[readOnlyHint](./IAiToolAnnotations.readOnlyHint.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Hint: the tool does not modify its environment (read-only).

</td></tr>
<tr><td>

[destructiveHint](./IAiToolAnnotations.destructiveHint.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Hint: the tool may perform destructive updates (only meaningful when not read-only).

</td></tr>
<tr><td>

[idempotentHint](./IAiToolAnnotations.idempotentHint.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Hint: repeated calls with the same arguments have no additional effect.

</td></tr>
<tr><td>

[openWorldHint](./IAiToolAnnotations.openWorldHint.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Hint: the tool interacts with an open world of external entities.

</td></tr>
</tbody></table>
