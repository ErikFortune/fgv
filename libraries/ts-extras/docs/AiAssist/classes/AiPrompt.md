[Home](../../README.md) > [AiAssist](../README.md) > AiPrompt

# Class: AiPrompt

A structured AI prompt with system/user split for direct API calls,
and a lazily-constructed combined version for copy/paste workflows.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(user, system)`

</td><td>



</td><td>



</td></tr>
</tbody></table>

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

[system](./AiPrompt.system.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

System instructions: schema documentation, format rules, general guidance.

</td></tr>
<tr><td>

[user](./AiPrompt.user.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

User request: the specific entity generation request.

</td></tr>
<tr><td>

[combined](./AiPrompt.combined.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Combined single-string version (user + system joined) for copy/paste.

</td></tr>
</tbody></table>
