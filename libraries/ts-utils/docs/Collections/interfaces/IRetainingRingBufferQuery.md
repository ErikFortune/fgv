[Home](../../README.md) > [Collections](../README.md) > IRetainingRingBufferQuery

# Interface: IRetainingRingBufferQuery

Query options for RetainingRingBuffer.query.

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

[sinceSeq](./IRetainingRingBufferQuery.sinceSeq.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

If supplied, only records with `seq > sinceSeq` are returned, enabling

</td></tr>
<tr><td>

[limit](./IRetainingRingBufferQuery.limit.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

If supplied, returns at most this many records — the most recent N (tail),

</td></tr>
<tr><td>

[filter](./IRetainingRingBufferQuery.filter.md)

</td><td>

`readonly`

</td><td>

(record: T) =&gt; boolean

</td><td>

If supplied, only records for which the predicate returns `true` are
returned.

</td></tr>
</tbody></table>
