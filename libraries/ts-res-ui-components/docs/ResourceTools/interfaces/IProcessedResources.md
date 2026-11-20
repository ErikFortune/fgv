[Home](../../README.md) > [ResourceTools](../README.md) > IProcessedResources

# Interface: IProcessedResources

Represents a fully processed ts-res system ready for use.
Contains both the runtime system components and the compiled resource collection.
This is the primary data structure used by all UI components.

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

[system](./IProcessedResources.system.md)

</td><td>



</td><td>

{ resourceManager: ResourceManagerBuilder; qualifierTypes: ReadOnlyQualifierTypeCollector; qualifiers: IReadOnlyQualifierCollector; resourceTypes: ReadOnlyResourceTypeCollector; importManager: ImportManager; contextQualifierProvider: ValidatingSimpleContextQualifierProvider }

</td><td>

Core ts-res system components

</td></tr>
<tr><td>

[compiledCollection](./IProcessedResources.compiledCollection.md)

</td><td>



</td><td>

ICompiledResourceCollection

</td><td>

Compiled version of the resource collection for efficient resolution

</td></tr>
<tr><td>

[resolver](./IProcessedResources.resolver.md)

</td><td>



</td><td>

ResourceResolver

</td><td>

Resource resolver for runtime resource resolution

</td></tr>
<tr><td>

[resourceCount](./IProcessedResources.resourceCount.md)

</td><td>



</td><td>

number

</td><td>

Total count of resources in the system

</td></tr>
<tr><td>

[summary](./IProcessedResources.summary.md)

</td><td>



</td><td>

{ totalResources: number; resourceIds: string[]; errorCount: number; warnings: string[] }

</td><td>

Summary information about the resource system

</td></tr>
</tbody></table>
