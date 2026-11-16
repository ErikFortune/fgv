[Home](../README.md) > IAsyncResultOptions

# Interface: IAsyncResultOptions

Options for the bounded-parallel asynchronous members of this family.

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

[concurrency](./IAsyncResultOptions.concurrency.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Maximum number of operations in flight at once.

</td></tr>
<tr><td>

[aggregatedErrors](./IAsyncResultOptions.aggregatedErrors.md)

</td><td>

`readonly`

</td><td>

[IMessageAggregator](IMessageAggregator.md)

</td><td>

Optional aggregator to which any error messages will be appended, matching the third
parameter of the synchronous members of this family.

</td></tr>
</tbody></table>
