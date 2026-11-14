[Home](../README.md) > IRetainedRecord

# Interface: IRetainedRecord

Minimal structural contract a RetainingRingBuffer record must satisfy:
a monotonic `seq` the buffer pages on. Records carry their own `seq` (assigned
by the caller) so the buffer is agnostic about how records are minted — a logger
assigns `seq` from its own counter, an observability layer assigns a library-global
`seq` shared across several buffers, etc.

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

[seq](./IRetainedRecord.seq.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Monotonic sequence number, assigned by the caller.

</td></tr>
</tbody></table>
