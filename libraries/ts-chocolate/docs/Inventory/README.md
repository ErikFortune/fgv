[Home](../README.md) > Inventory

# Namespace: Inventory

Inventory entities for the user library.

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Converters](./Converters/README.md)

</td><td>

Converters for inventory entry types

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IInventoryEntryEntityBase](./interfaces/IInventoryEntryEntityBase.md)

</td><td>

Common properties shared by all inventory entry types.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[MoldInventoryEntryBaseId](./type-aliases/MoldInventoryEntryBaseId.md)

</td><td>

Base ID for a mold inventory entry within an inventory collection.

</td></tr>
<tr><td>

[MoldInventoryEntryId](./type-aliases/MoldInventoryEntryId.md)

</td><td>

Composite ID for a mold inventory entry (inventoryCollection.entryBaseId).

</td></tr>
<tr><td>

[IngredientInventoryEntryBaseId](./type-aliases/IngredientInventoryEntryBaseId.md)

</td><td>

Base ID for an ingredient inventory entry within an inventory collection.

</td></tr>
<tr><td>

[IngredientInventoryEntryId](./type-aliases/IngredientInventoryEntryId.md)

</td><td>

Composite ID for an ingredient inventory entry (inventoryCollection.entryBaseId).

</td></tr>
<tr><td>

[InventorySchemaVersion](./type-aliases/InventorySchemaVersion.md)

</td><td>

Schema version discriminator type.

</td></tr>
<tr><td>

[AnyInventoryEntryEntity](./type-aliases/AnyInventoryEntryEntity.md)

</td><td>

Discriminated union of all inventory entry types.

</td></tr>
<tr><td>

[MoldInventoryCollectionEntry](./type-aliases/MoldInventoryCollectionEntry.md)

</td><td>

A single entry in a mold inventory collection.

</td></tr>
<tr><td>

[MoldInventoryCollectionEntryInit](./type-aliases/MoldInventoryCollectionEntryInit.md)

</td><td>

Initialization type for a MoldInventoryLibrary collection entry.

</td></tr>
<tr><td>

[MoldInventoryCollectionValidator](./type-aliases/MoldInventoryCollectionValidator.md)

</td><td>

Validator type for MoldInventoryLibrary collections.

</td></tr>
<tr><td>

[MoldInventoryCollection](./type-aliases/MoldInventoryCollection.md)

</td><td>

Type for the collections in a MoldInventoryLibrary.

</td></tr>
<tr><td>

[IngredientInventoryCollectionEntry](./type-aliases/IngredientInventoryCollectionEntry.md)

</td><td>

A single entry in an ingredient inventory collection.

</td></tr>
<tr><td>

[IngredientInventoryCollectionEntryInit](./type-aliases/IngredientInventoryCollectionEntryInit.md)

</td><td>

Initialization type for an IngredientInventoryLibrary collection entry.

</td></tr>
<tr><td>

[IngredientInventoryCollectionValidator](./type-aliases/IngredientInventoryCollectionValidator.md)

</td><td>

Validator type for IngredientInventoryLibrary collections.

</td></tr>
<tr><td>

[IngredientInventoryCollection](./type-aliases/IngredientInventoryCollection.md)

</td><td>

Type for the collections in an IngredientInventoryLibrary.

</td></tr>
<tr><td>

[IMoldInventoryFileTreeSource](./type-aliases/IMoldInventoryFileTreeSource.md)

</td><td>

File tree source for mold inventory data.

</td></tr>
<tr><td>

[MoldInventoryMergeSource](./type-aliases/MoldInventoryMergeSource.md)

</td><td>

Specifies a mold inventory library to merge into a new library.

</td></tr>
<tr><td>

[IMoldInventoryLibraryParams](./type-aliases/IMoldInventoryLibraryParams.md)

</td><td>

Parameters for creating a MoldInventoryLibrary instance synchronously.

</td></tr>
<tr><td>

[IMoldInventoryLibraryAsyncParams](./type-aliases/IMoldInventoryLibraryAsyncParams.md)

</td><td>

Parameters for creating a MoldInventoryLibrary instance asynchronously with encryption support.

</td></tr>
<tr><td>

[IIngredientInventoryFileTreeSource](./type-aliases/IIngredientInventoryFileTreeSource.md)

</td><td>

File tree source for ingredient inventory data.

</td></tr>
<tr><td>

[IngredientInventoryMergeSource](./type-aliases/IngredientInventoryMergeSource.md)

</td><td>

Specifies an ingredient inventory library to merge into a new library.

</td></tr>
<tr><td>

[IIngredientInventoryLibraryParams](./type-aliases/IIngredientInventoryLibraryParams.md)

</td><td>

Parameters for creating an IngredientInventoryLibrary instance synchronously.

</td></tr>
<tr><td>

[IIngredientInventoryLibraryAsyncParams](./type-aliases/IIngredientInventoryLibraryAsyncParams.md)

</td><td>

Parameters for creating an IngredientInventoryLibrary instance asynchronously with encryption support.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[isMoldInventoryEntryEntity](./functions/isMoldInventoryEntryEntity.md)

</td><td>

Type guard for IMoldInventoryEntry.

</td></tr>
<tr><td>

[isIngredientInventoryEntryEntity](./functions/isIngredientInventoryEntryEntity.md)

</td><td>

Type guard for IIngredientInventoryEntry.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[INVENTORY_SCHEMA_VERSION](./variables/INVENTORY_SCHEMA_VERSION.md)

</td><td>

Current schema version for inventory entries.

</td></tr>
<tr><td>

[allInventoryTypes](./variables/allInventoryTypes.md)

</td><td>

All possible inventory types.

</td></tr>
</tbody></table>
