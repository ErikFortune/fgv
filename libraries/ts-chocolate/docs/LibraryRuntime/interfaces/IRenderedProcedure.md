[Home](../../README.md) > [LibraryRuntime](../README.md) > IRenderedProcedure

# Interface: IRenderedProcedure

A rendered procedure with all template values resolved.

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

[name](./IRenderedProcedure.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Name of the procedure

</td></tr>
<tr><td>

[description](./IRenderedProcedure.description.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional description

</td></tr>
<tr><td>

[steps](./IRenderedProcedure.steps.md)

</td><td>

`readonly`

</td><td>

readonly [IRenderedStep](../../interfaces/IRenderedStep.md)[]

</td><td>

Rendered steps with resolved task templates

</td></tr>
<tr><td>

[totalActiveTime](./IRenderedProcedure.totalActiveTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md)

</td><td>

Total active time for all steps

</td></tr>
<tr><td>

[totalWaitTime](./IRenderedProcedure.totalWaitTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md)

</td><td>

Total wait time for all steps

</td></tr>
<tr><td>

[totalHoldTime](./IRenderedProcedure.totalHoldTime.md)

</td><td>

`readonly`

</td><td>

[Minutes](../../type-aliases/Minutes.md)

</td><td>

Total hold time for all steps

</td></tr>
</tbody></table>
