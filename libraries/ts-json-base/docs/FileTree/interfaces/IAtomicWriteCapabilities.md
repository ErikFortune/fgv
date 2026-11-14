[Home](../../README.md) > [FileTree](../README.md) > IAtomicWriteCapabilities

# Interface: IAtomicWriteCapabilities

Reports what atomic replacement a directory's backing store can actually
offer.

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

[atomicReplace](./IAtomicWriteCapabilities.atomicReplace.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

`true` if this store can replace a file such that a reader never observes

</td></tr>
<tr><td>

[guarantees](./IAtomicWriteCapabilities.guarantees.md)

</td><td>

`readonly`

</td><td>

readonly ("session" | "process-crash" | "os-crash" | "power-loss")[]

</td><td>

The durability guarantees this store can honor for an atomic write,
weakest to strongest.

</td></tr>
<tr><td>

[reason](./IAtomicWriteCapabilities.reason.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Why the store answered as it did, in a form that can be shown to a caller
whose durable write would be refused — for a capable store as well as an
incapable one.

</td></tr>
</tbody></table>
