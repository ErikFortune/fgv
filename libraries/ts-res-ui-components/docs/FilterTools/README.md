[Home](../README.md) > FilterTools

# Namespace: FilterTools

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IFilterOptions](./interfaces/IFilterOptions.md)

</td><td>

Options for configuring filtering behavior and output.

</td></tr>
<tr><td>

[IFilterState](./interfaces/IFilterState.md)

</td><td>

Represents the current state of resource filtering.

</td></tr>
<tr><td>

[IFilterActions](./interfaces/IFilterActions.md)

</td><td>

Actions available for managing filter state.

</td></tr>
<tr><td>

[IFilterViewProps](./interfaces/IFilterViewProps.md)

</td><td>

Props for the FilterView component.

</td></tr>
<tr><td>

[IFilterResult](./interfaces/IFilterResult.md)

</td><td>

Complete result of a filtering operation including processed data and analysis.

</td></tr>
<tr><td>

[IFilteredResource](./interfaces/IFilteredResource.md)

</td><td>

Information about a single resource after filtering has been applied.

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

[useFilterState](./functions/useFilterState.md)

</td><td>

Hook for managing resource filtering state.

</td></tr>
<tr><td>

[createFilteredResourceManagerSimple](./functions/createFilteredResourceManagerSimple.md)

</td><td>

Creates a filtered resource manager by applying context filters to reduce resource candidates.

</td></tr>
<tr><td>

[analyzeFilteredResources](./functions/analyzeFilteredResources.md)

</td><td>

Analyzes the impact of filtering on resources by comparing original and filtered resource sets.

</td></tr>
<tr><td>

[hasFilterValues](./functions/hasFilterValues.md)

</td><td>

Checks if a filter values object contains any meaningful (non-empty) filter values.

</td></tr>
<tr><td>

[getFilterSummary](./functions/getFilterSummary.md)

</td><td>

Creates a human-readable summary string of active filter values.

</td></tr>
</tbody></table>
