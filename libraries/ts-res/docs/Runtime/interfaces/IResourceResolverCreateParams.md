[Home](../../README.md) > [Runtime](../README.md) > IResourceResolverCreateParams

# Interface: IResourceResolverCreateParams

Parameters for creating a Runtime.ResourceResolver | ResourceResolver.

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

[resourceManager](./IResourceResolverCreateParams.resourceManager.md)

</td><td>



</td><td>

[IResourceManager](../../interfaces/IResourceManager.md)

</td><td>

The Runtime.IResourceManager | resource manager that defines the resources available

</td></tr>
<tr><td>

[qualifierTypes](./IResourceResolverCreateParams.qualifierTypes.md)

</td><td>



</td><td>

[ReadOnlyQualifierTypeCollector](../../type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

The QualifierTypes.ReadOnlyQualifierTypeCollector | readonly qualifier type collector

</td></tr>
<tr><td>

[contextQualifierProvider](./IResourceResolverCreateParams.contextQualifierProvider.md)

</td><td>



</td><td>

[IContextQualifierProvider](../../type-aliases/IContextQualifierProvider.md)

</td><td>

The Runtime.Context.IContextQualifierProvider | context qualifier provider that resolves

</td></tr>
<tr><td>

[listener](./IResourceResolverCreateParams.listener.md)

</td><td>



</td><td>

[IResourceResolverCacheListener](../../interfaces/IResourceResolverCacheListener.md)

</td><td>

An optional listener for Runtime.ResourceResolver | ResourceResolver cache activity.

</td></tr>
<tr><td>

[options](./IResourceResolverCreateParams.options.md)

</td><td>



</td><td>

[IResourceResolverOptions](../../interfaces/IResourceResolverOptions.md)

</td><td>

Optional configuration options for the Runtime.ResourceResolver | ResourceResolver.

</td></tr>
</tbody></table>
