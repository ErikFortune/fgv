[Home](../../README.md) > [LibraryData](../README.md) > IConflictingCollectionCopy

# Interface: IConflictingCollectionCopy

Describes one copy of a collection involved in an ID collision.

Used to surface all copies — loaded and encrypted — so the user can
choose which one(s) to keep or remove via Settings → Storage.

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

[sourceName](./IConflictingCollectionCopy.sourceName.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Which storage root loaded this copy.

</td></tr>
<tr><td>

[isEncrypted](./IConflictingCollectionCopy.isEncrypted.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

True if this copy is an encrypted/protected collection.

</td></tr>
<tr><td>

[itemCount](./IConflictingCollectionCopy.itemCount.md)

</td><td>

`readonly`

</td><td>

number | undefined

</td><td>

Item count, if known.

</td></tr>
<tr><td>

[secretName](./IConflictingCollectionCopy.secretName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Secret name used for encryption.

</td></tr>
<tr><td>

[isMutable](./IConflictingCollectionCopy.isMutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the backing file can be deleted (i.e., from a mutable root).

</td></tr>
</tbody></table>
