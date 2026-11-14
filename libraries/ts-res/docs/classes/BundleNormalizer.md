[Home](../README.md) > BundleNormalizer

# Class: BundleNormalizer

Normalizes ResourceManagerBuilder instances to ensure consistent ordering
of internal entities, enabling order-independent bundle checksums.

The normalization process rebuilds the ResourceManagerBuilder from the ground up
in a canonical order to ensure identical index assignments regardless of
original construction order.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor()`

</td><td>



</td><td>



</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[normalize(originalBuilder, systemConfig)](./BundleNormalizer.normalize.md)

</td><td>

`static`

</td><td>

Creates a normalized ResourceManagerBuilder from an existing builder.

</td></tr>
<tr><td>

[normalizeFromPredefined(originalBuilder, configName)](./BundleNormalizer.normalizeFromPredefined.md)

</td><td>

`static`

</td><td>

Creates a normalized ResourceManagerBuilder using a predefined system configuration.

</td></tr>
</tbody></table>
