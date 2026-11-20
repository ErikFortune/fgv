[Home](../README.md) > IBundleMetadata

# Interface: IBundleMetadata

Metadata for a resource bundle, including build information and integrity verification.

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

[dateBuilt](./IBundleMetadata.dateBuilt.md)

</td><td>



</td><td>

string

</td><td>

ISO timestamp indicating when the bundle was built.

</td></tr>
<tr><td>

[checksum](./IBundleMetadata.checksum.md)

</td><td>



</td><td>

string

</td><td>

SHA-256 checksum of the serialized compiled resource collection for integrity verification.

</td></tr>
<tr><td>

[version](./IBundleMetadata.version.md)

</td><td>



</td><td>

string

</td><td>

Optional version identifier for the bundle.

</td></tr>
<tr><td>

[description](./IBundleMetadata.description.md)

</td><td>



</td><td>

string

</td><td>

Optional human-readable description of the bundle.

</td></tr>
</tbody></table>
