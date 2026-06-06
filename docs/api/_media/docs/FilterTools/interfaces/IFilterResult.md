[Home](../../README.md) > [FilterTools](../README.md) > IFilterResult

# Interface: IFilterResult

Complete result of a filtering operation including processed data and analysis.

IFilterResult encapsulates the outcome of applying resource filtering, providing
both the filtered resource system and detailed analytics about the filtering
process. It includes success/failure status, processed resources, per-resource
analysis, and any warnings or errors encountered during filtering.

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

[success](./IFilterResult.success.md)

</td><td>



</td><td>

boolean

</td><td>

Whether the filtering operation completed successfully

</td></tr>
<tr><td>

[processedResources](./IFilterResult.processedResources.md)

</td><td>



</td><td>

[IProcessedResources](../../interfaces/IProcessedResources.md)

</td><td>

The filtered processed resources, available if filtering succeeded

</td></tr>
<tr><td>

[filteredResources](./IFilterResult.filteredResources.md)

</td><td>



</td><td>

[IFilteredResource](../../interfaces/IFilteredResource.md)[]

</td><td>

Analysis of individual resources after filtering, showing per-resource impact

</td></tr>
<tr><td>

[warnings](./IFilterResult.warnings.md)

</td><td>



</td><td>

string[]

</td><td>

Warning messages about potential filtering issues or edge cases

</td></tr>
<tr><td>

[error](./IFilterResult.error.md)

</td><td>



</td><td>

string

</td><td>

Error message if the filtering operation failed

</td></tr>
</tbody></table>
