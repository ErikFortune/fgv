[Home](../README.md) > IBundleExportMetadata

# Interface: IBundleExportMetadata

Optional export metadata for tracking bundle export information.

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

[exportedAt](./IBundleExportMetadata.exportedAt.md)

</td><td>



</td><td>

string

</td><td>

ISO timestamp indicating when the bundle was exported.

</td></tr>
<tr><td>

[exportedFrom](./IBundleExportMetadata.exportedFrom.md)

</td><td>



</td><td>

string

</td><td>

Tool or application that exported the bundle.

</td></tr>
<tr><td>

[type](./IBundleExportMetadata.type.md)

</td><td>



</td><td>

string

</td><td>

Type of bundle export (e.g., 'ts-res-bundle', 'ts-res-bundle-filtered').

</td></tr>
<tr><td>

[filterContext](./IBundleExportMetadata.filterContext.md)

</td><td>



</td><td>

Record&lt;string, unknown&gt;

</td><td>

Optional filter context if the bundle represents filtered data.

</td></tr>
</tbody></table>
