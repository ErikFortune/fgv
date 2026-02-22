[Home](../README.md) > ISettingsValidationContext

# Interface: ISettingsValidationContext

Context provided to the validator describing what is actually available
in the workspace at runtime.

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

[availableRoots](./ISettingsValidationContext.availableRoots.md)

</td><td>

`readonly`

</td><td>

ReadonlySet&lt;[StorageRootId](../type-aliases/StorageRootId.md)&gt;

</td><td>

The set of storage root IDs that are currently loaded and available.

</td></tr>
<tr><td>

[availableCollections](./ISettingsValidationContext.availableCollections.md)

</td><td>

`readonly`

</td><td>

Partial&lt;Record&lt;[SubLibraryId](../type-aliases/SubLibraryId.md), ReadonlySet&lt;[CollectionId](../type-aliases/CollectionId.md)&gt;&gt;&gt;

</td><td>

The set of collection IDs available per sub-library.

</td></tr>
</tbody></table>
