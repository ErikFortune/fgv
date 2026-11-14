[Home](../../README.md) > [ResourceTools](../README.md) > IExtendedProcessedResources

# Interface: IExtendedProcessedResources

Extended processed resources with additional metadata and context.
Includes information about source configuration and bundle loading.

**Extends:** [`IProcessedResources`](../../interfaces/IProcessedResources.md)

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

[activeConfiguration](./IExtendedProcessedResources.activeConfiguration.md)

</td><td>



</td><td>

ISystemConfiguration | null

</td><td>

The configuration used to create this resource system

</td></tr>
<tr><td>

[isLoadedFromBundle](./IExtendedProcessedResources.isLoadedFromBundle.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this system was loaded from a bundle file

</td></tr>
<tr><td>

[bundleMetadata](./IExtendedProcessedResources.bundleMetadata.md)

</td><td>



</td><td>

IBundleMetadata | null

</td><td>

Metadata from the bundle file, if loaded from bundle

</td></tr>
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
