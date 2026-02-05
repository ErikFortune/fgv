[Home](../../README.md) > [LibraryRuntime](../README.md) > IQueryResult

# Interface: IQueryResult

Result of a query execution with metadata

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

[items](./IQueryResult.items.md)

</td><td>

`readonly`

</td><td>

readonly T[]

</td><td>

The matched items

</td></tr>
<tr><td>

[totalCount](./IQueryResult.totalCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Total count of items before pagination (if applicable)

</td></tr>
<tr><td>

[hasMore](./IQueryResult.hasMore.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether there are more items available (for pagination)

</td></tr>
</tbody></table>
