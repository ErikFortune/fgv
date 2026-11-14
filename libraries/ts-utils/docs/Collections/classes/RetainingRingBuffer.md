[Home](../../README.md) > [Collections](../README.md) > RetainingRingBuffer

# Class: RetainingRingBuffer

A generic bounded most-recent-N ring of records, with monotonic-`seq` cursor
paging and predicate filtering.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(params)`

</td><td>



</td><td>

Creates a new retaining ring buffer.

</td></tr>
</tbody></table>

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

[size](./RetainingRingBuffer.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of records currently retained.

</td></tr>
<tr><td>

[lastSeq](./RetainingRingBuffer.lastSeq.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The highest `seq` pushed so far.

</td></tr>
<tr><td>

[records](./RetainingRingBuffer.records.md)

</td><td>

`readonly`

</td><td>

readonly T[]

</td><td>

The retained records, oldest-first.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[push(record)](./RetainingRingBuffer.push.md)

</td><td>



</td><td>

Retains a record, evicting the oldest if the ring is full.

</td></tr>
<tr><td>

[query(query)](./RetainingRingBuffer.query.md)

</td><td>



</td><td>

Returns retained records, oldest-first, optionally filtered and paged.

</td></tr>
<tr><td>

[clear()](./RetainingRingBuffer.clear.md)

</td><td>



</td><td>

Clears all retained records.

</td></tr>
</tbody></table>
