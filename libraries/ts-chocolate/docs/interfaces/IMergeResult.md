[Home](../README.md) > IMergeResult

# Interface: IMergeResult

Result of a collection merge operation.

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

[mergedCount](./IMergeResult.mergedCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of items successfully merged into the target collection

</td></tr>
<tr><td>

[skippedCount](./IMergeResult.skippedCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Number of items skipped due to conflict (only when strategy is 'skip')

</td></tr>
<tr><td>

[renamedItems](./IMergeResult.renamedItems.md)

</td><td>

`readonly`

</td><td>

readonly { oldBaseId: string; newBaseId: string }[]

</td><td>

Items that were auto-renamed to avoid conflicts (only when strategy is 'rename')

</td></tr>
</tbody></table>
