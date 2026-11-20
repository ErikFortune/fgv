[Home](../../README.md) > [AiAssist](../README.md) > IAiToolConflictReport

# Interface: IAiToolConflictReport

What the conflict resolution did to a turn's tools.

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

[policy](./IAiToolConflictReport.policy.md)

</td><td>

`readonly`

</td><td>

[AiToolConflictPolicy](../../type-aliases/AiToolConflictPolicy.md)

</td><td>

The policy that was in force for this turn (the default when none was passed).

</td></tr>
<tr><td>

[droppedServerTools](./IAiToolConflictReport.droppedServerTools.md)

</td><td>

`readonly`

</td><td>

readonly "web_search"[]

</td><td>

Server tool types removed from the request.

</td></tr>
<tr><td>

[droppedClientTools](./IAiToolConflictReport.droppedClientTools.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Names of client tools removed from the request.

</td></tr>
</tbody></table>
