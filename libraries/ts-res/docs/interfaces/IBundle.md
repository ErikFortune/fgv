[Home](../README.md) > IBundle

# Interface: IBundle

A complete resource bundle that encapsulates built resources, configuration, and metadata.
Bundles provide a portable, integrity-verified way to distribute pre-compiled resource collections.

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

[metadata](./IBundle.metadata.md)

</td><td>



</td><td>

[IBundleMetadata](IBundleMetadata.md)

</td><td>

Metadata about the bundle including build date and integrity checksum.

</td></tr>
<tr><td>

[config](./IBundle.config.md)

</td><td>



</td><td>

[ISystemConfiguration](ISystemConfiguration.md)

</td><td>

The system configuration that was used to build the resources in this bundle.

</td></tr>
<tr><td>

[compiledCollection](./IBundle.compiledCollection.md)

</td><td>



</td><td>

[ICompiledResourceCollection](ICompiledResourceCollection.md)

</td><td>

The compiled resource collection containing all resources, conditions, and decisions.

</td></tr>
<tr><td>

[exportMetadata](./IBundle.exportMetadata.md)

</td><td>



</td><td>

[IBundleExportMetadata](IBundleExportMetadata.md)

</td><td>

Optional export metadata for tracking when and how the bundle was exported.

</td></tr>
</tbody></table>
