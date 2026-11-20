[Home](../README.md) > Bundle

# Namespace: Bundle

Bundle packlet providing functionality for creating and loading resource bundles.

Resource bundles encapsulate compiled resources, configuration, and metadata with
integrity verification. They provide a portable way to distribute pre-compiled
resource collections.

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Model](./Model/README.md)

</td><td>



</td></tr>
<tr><td>

[Convert](./Convert/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[BundleUtils](./classes/BundleUtils.md)

</td><td>

Utility functions for working with resource bundles.

</td></tr>
<tr><td>

[BundleNormalizer](./classes/BundleNormalizer.md)

</td><td>

Normalizes ResourceManagerBuilder instances to ensure consistent ordering
of internal entities, enabling order-independent bundle checksums.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IBundleMetadata](./interfaces/IBundleMetadata.md)

</td><td>

Metadata for a resource bundle, including build information and integrity verification.

</td></tr>
<tr><td>

[IBundleExportMetadata](./interfaces/IBundleExportMetadata.md)

</td><td>

Optional export metadata for tracking bundle export information.

</td></tr>
<tr><td>

[IBundle](./interfaces/IBundle.md)

</td><td>

A complete resource bundle that encapsulates built resources, configuration, and metadata.

</td></tr>
<tr><td>

[IBundleCreateParams](./interfaces/IBundleCreateParams.md)

</td><td>

Optional parameters for bundle creation.

</td></tr>
<tr><td>

[IBundleLoaderCreateParams](./interfaces/IBundleLoaderCreateParams.md)

</td><td>

Parameters for creating a BundleLoader.

</td></tr>
<tr><td>

[IBundleComponents](./interfaces/IBundleComponents.md)

</td><td>

Components extracted from a bundle for reuse in different contexts.

</td></tr>
</tbody></table>
