[Home](../../README.md) > [AiAssist](../README.md) > IChatRequest

# Interface: IChatRequest

An ordered chat request: optional system instructions plus the conversation
turns. The **last** entry in `messages` is the current turn (always a `user`
turn); everything before it is prior conversation history.

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

[system](./IChatRequest.system.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

System instructions (schema docs, format rules, general guidance).

</td></tr>
<tr><td>

[messages](./IChatRequest.messages.md)

</td><td>

`readonly`

</td><td>

readonly [IChatMessage](../../interfaces/IChatMessage.md)[]

</td><td>

The ordered conversation turns.

</td></tr>
</tbody></table>
