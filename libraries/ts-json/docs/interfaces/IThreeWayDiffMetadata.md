[Home](../README.md) > IThreeWayDiffMetadata

# Interface: IThreeWayDiffMetadata

Metadata about the differences found in a three-way diff.

Provides summary statistics about the types and quantities of changes
detected between two JSON values, making it easy to understand the
overall scope of differences at a glance.

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

[removed](./IThreeWayDiffMetadata.removed.md)

</td><td>



</td><td>

number

</td><td>

Number of properties that exist only in the first object.

</td></tr>
<tr><td>

[added](./IThreeWayDiffMetadata.added.md)

</td><td>



</td><td>

number

</td><td>

Number of properties that exist only in the second object.

</td></tr>
<tr><td>

[modified](./IThreeWayDiffMetadata.modified.md)

</td><td>



</td><td>

number

</td><td>

Number of properties that exist in both objects but have different values.

</td></tr>
<tr><td>

[unchanged](./IThreeWayDiffMetadata.unchanged.md)

</td><td>



</td><td>

number

</td><td>

Number of properties that exist in both objects with identical values.

</td></tr>
</tbody></table>
