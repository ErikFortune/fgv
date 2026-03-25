[Home](../README.md) > IDeltaGeneratorParams

# Interface: IDeltaGeneratorParams

Interface for parameters to create a Resources.DeltaGenerator | DeltaGenerator.

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

[baselineResolver](./IDeltaGeneratorParams.baselineResolver.md)

</td><td>



</td><td>

[IResourceResolver](IResourceResolver.md)

</td><td>

The baseline resource resolver to compare against.

</td></tr>
<tr><td>

[deltaResolver](./IDeltaGeneratorParams.deltaResolver.md)

</td><td>



</td><td>

[IResourceResolver](IResourceResolver.md)

</td><td>

The delta resource resolver containing changes.

</td></tr>
<tr><td>

[resourceManager](./IDeltaGeneratorParams.resourceManager.md)

</td><td>



</td><td>

[ResourceManagerBuilder](../classes/ResourceManagerBuilder.md)

</td><td>

The resource manager to clone and update.

</td></tr>
<tr><td>

[logger](./IDeltaGeneratorParams.logger.md)

</td><td>



</td><td>

ILogger

</td><td>

Optional logger for status and error reporting.

</td></tr>
</tbody></table>
