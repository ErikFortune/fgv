[Home](../README.md) > ICollectionIdConflict

# Interface: ICollectionIdConflict

Represents a collection ID collision across multiple sources.

The `activeCopy` is the copy currently in use (first-seen winner).
All other copies with the same ID are in `conflictingCopies`.

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

[collectionId](./ICollectionIdConflict.collectionId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The collection ID that is duplicated.

</td></tr>
<tr><td>

[activeCopy](./ICollectionIdConflict.activeCopy.md)

</td><td>

`readonly`

</td><td>

[IConflictingCollectionCopy](IConflictingCollectionCopy.md)

</td><td>

The copy currently accessible at runtime.

</td></tr>
<tr><td>

[conflictingCopies](./ICollectionIdConflict.conflictingCopies.md)

</td><td>

`readonly`

</td><td>

readonly [IConflictingCollectionCopy](IConflictingCollectionCopy.md)[]

</td><td>

All other copies with the same ID that were discarded on load.

</td></tr>
</tbody></table>
