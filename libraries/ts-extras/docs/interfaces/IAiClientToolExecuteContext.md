[Home](../README.md) > IAiClientToolExecuteContext

# Interface: IAiClientToolExecuteContext

Per-call context handed to `IAiClientTool.execute` alongside the arguments.

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

[signal](./IAiClientToolExecuteContext.signal.md)

</td><td>

`readonly`

</td><td>

AbortSignal

</td><td>

The turn's abort signal — `IExecuteClientToolTurnParams.signal`, when the caller supplied one.

</td></tr>
</tbody></table>
