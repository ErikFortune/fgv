[Home](../README.md) > IFilteredResource

# Interface: IFilteredResource

Information about a single resource after filtering has been applied.

FilteredResource provides detailed analytics about how filtering affected
an individual resource, including candidate count changes and potential
issues detected during the filtering process. This information is essential
for understanding filtering effectiveness and diagnosing filtering problems.

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

[id](./IFilteredResource.id.md)

</td><td>



</td><td>

string

</td><td>

The resource ID that was filtered

</td></tr>
<tr><td>

[originalCandidateCount](./IFilteredResource.originalCandidateCount.md)

</td><td>



</td><td>

number

</td><td>

Number of candidates before filtering was applied

</td></tr>
<tr><td>

[filteredCandidateCount](./IFilteredResource.filteredCandidateCount.md)

</td><td>



</td><td>

number

</td><td>

Number of candidates remaining after filtering

</td></tr>
<tr><td>

[hasWarning](./IFilteredResource.hasWarning.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this resource has potential filtering issues or warnings

</td></tr>
</tbody></table>
