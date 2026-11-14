[Home](../../README.md) > [AiAssist](../README.md) > IAiResolvedToolConflicts

# Interface: IAiResolvedToolConflicts

The outcome of AiAssist.resolveToolConflicts: the tools that survived,
plus the report of what did not.

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

[serverTools](./IAiResolvedToolConflicts.serverTools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiWebSearchToolConfig](../../interfaces/IAiWebSearchToolConfig.md)[]

</td><td>

Server tools to send, after the policy was applied.

</td></tr>
<tr><td>

[clientTools](./IAiResolvedToolConflicts.clientTools.md)

</td><td>

`readonly`

</td><td>

readonly [IAiClientTool](../../interfaces/IAiClientTool.md)&lt;unknown&gt;[]

</td><td>

Client tools to send, after the policy was applied.

</td></tr>
<tr><td>

[report](./IAiResolvedToolConflicts.report.md)

</td><td>

`readonly`

</td><td>

[IAiToolConflictReport](../../interfaces/IAiToolConflictReport.md)

</td><td>

What the resolution did.

</td></tr>
</tbody></table>
