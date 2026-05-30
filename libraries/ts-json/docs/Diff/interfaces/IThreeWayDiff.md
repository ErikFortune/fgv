[Home](../../README.md) > [Diff](../README.md) > IThreeWayDiff

# Interface: IThreeWayDiff

Result of a three-way JSON diff operation.

This interface provides an actionable representation of differences between
two JSON values by separating them into three distinct objects. This approach
makes it easy to apply changes, display side-by-side comparisons, perform
merges, or programmatically work with the differences.

**Key Benefits:**
- **Actionable Results**: Objects can be directly used for merging or applying changes
- **UI-Friendly**: Perfect for side-by-side diff displays with clear visual separation
- **Merge-Ready**: Simplified three-way merge operations
- **Structured Data**: Maintains original JSON structure rather than flattened paths

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

[onlyInA](./IThreeWayDiff.onlyInA.md)

</td><td>



</td><td>

JsonValue

</td><td>

Contains properties that exist only in the first object, plus the first object's
version of any properties that exist in both but have different values.

</td></tr>
<tr><td>

[unchanged](./IThreeWayDiff.unchanged.md)

</td><td>



</td><td>

JsonValue

</td><td>

Contains properties that exist in both objects with identical values.

</td></tr>
<tr><td>

[onlyInB](./IThreeWayDiff.onlyInB.md)

</td><td>



</td><td>

JsonValue

</td><td>

Contains properties that exist only in the second object, plus the second object's
version of any properties that exist in both but have different values.

</td></tr>
<tr><td>

[metadata](./IThreeWayDiff.metadata.md)

</td><td>



</td><td>

[IThreeWayDiffMetadata](../../interfaces/IThreeWayDiffMetadata.md)

</td><td>

Summary metadata about the differences found.

</td></tr>
<tr><td>

[identical](./IThreeWayDiff.identical.md)

</td><td>



</td><td>

boolean

</td><td>

True if the objects are identical, false otherwise.

</td></tr>
</tbody></table>
