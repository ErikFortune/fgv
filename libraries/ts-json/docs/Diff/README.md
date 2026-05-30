[Home](../README.md) > Diff

# Namespace: Diff

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IDiffChange](./interfaces/IDiffChange.md)

</td><td>

Represents a single change in a JSON diff operation.

</td></tr>
<tr><td>

[IDiffResult](./interfaces/IDiffResult.md)

</td><td>

Result of a JSON diff operation containing all detected changes.

</td></tr>
<tr><td>

[IJsonDiffOptions](./interfaces/IJsonDiffOptions.md)

</td><td>

Options for customizing JSON diff behavior.

</td></tr>
<tr><td>

[IThreeWayDiffMetadata](./interfaces/IThreeWayDiffMetadata.md)

</td><td>

Metadata about the differences found in a three-way diff.

</td></tr>
<tr><td>

[IThreeWayDiff](./interfaces/IThreeWayDiff.md)

</td><td>

Result of a three-way JSON diff operation.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[DiffChangeType](./type-aliases/DiffChangeType.md)

</td><td>

Type of change detected in a JSON diff operation.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[jsonDiff](./functions/jsonDiff.md)

</td><td>

Performs a deep diff comparison between two JSON values.

</td></tr>
<tr><td>

[jsonEquals](./functions/jsonEquals.md)

</td><td>

A simpler helper function that returns true if two JSON values are deeply equal.

</td></tr>
<tr><td>

[jsonThreeWayDiff](./functions/jsonThreeWayDiff.md)

</td><td>

Performs a three-way diff comparison between two JSON values, returning separate
objects containing the differences and similarities.

</td></tr>
</tbody></table>
