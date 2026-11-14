[Home](../README.md) > IChatMessage

# Interface: IChatMessage

A single chat message in OpenAI format.

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

[role](./IChatMessage.role.md)

</td><td>

`readonly`

</td><td>

"user" | "system" | "assistant"

</td><td>

Message role

</td></tr>
<tr><td>

[content](./IChatMessage.content.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Message content

</td></tr>
<tr><td>

[attachments](./IChatMessage.attachments.md)

</td><td>

`readonly`

</td><td>

readonly [IAiImageAttachment](IAiImageAttachment.md)[]

</td><td>

Optional image attachments.

</td></tr>
</tbody></table>
