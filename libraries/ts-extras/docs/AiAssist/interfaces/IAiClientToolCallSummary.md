[Home](../../README.md) > [AiAssist](../README.md) > IAiClientToolCallSummary

# Interface: IAiClientToolCallSummary

Summary of a single client tool call within a turn: the tool name, call ID,
raw arguments, execution result, and whether the execution was an error.

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

[toolName](./IAiClientToolCallSummary.toolName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the tool that was called.

</td></tr>
<tr><td>

[callId](./IAiClientToolCallSummary.callId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Provider-assigned call identifier (absent for Gemini).

</td></tr>
<tr><td>

[args](./IAiClientToolCallSummary.args.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

The fully accumulated raw arguments object as parsed JSON.

</td></tr>
<tr><td>

[result](./IAiClientToolCallSummary.result.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The stringified result (success value or error message).

</td></tr>
<tr><td>

[isError](./IAiClientToolCallSummary.isError.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether execution failed (schema validation failure, execute error, or unknown tool).

</td></tr>
</tbody></table>
