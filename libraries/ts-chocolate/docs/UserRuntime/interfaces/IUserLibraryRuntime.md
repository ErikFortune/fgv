[Home](../../README.md) > [UserRuntime](../README.md) > IUserLibraryRuntime

# Interface: IUserLibraryRuntime

Runtime materialization layer for user library data.

Follows the library-runtime pattern:
- Exposes underlying entity library for direct access
- Provides MaterializedLibrary instances for sessions, journals, and inventory
- Lazy resolution and caching of materialized objects

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

[sessions](./IUserLibraryRuntime.sessions.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[SessionId](../../type-aliases/SessionId.md), [AnySessionEntity](../../type-aliases/AnySessionEntity.md), [AnyMaterializedSession](../../type-aliases/AnyMaterializedSession.md), never&gt;

</td><td>

A materialized library of all sessions, keyed by composite ID.

</td></tr>
<tr><td>

[journals](./IUserLibraryRuntime.journals.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[JournalId](../../type-aliases/JournalId.md), [AnyJournalEntryEntity](../../type-aliases/AnyJournalEntryEntity.md), [AnyJournalEntry](../../type-aliases/AnyJournalEntry.md), never&gt;

</td><td>

A materialized library of all journal entries, keyed by composite ID.

</td></tr>
<tr><td>

[moldInventory](./IUserLibraryRuntime.moldInventory.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[MoldInventoryEntryId](../../type-aliases/MoldInventoryEntryId.md), [IMoldInventoryEntryEntity](../../interfaces/IMoldInventoryEntryEntity.md), [IMoldInventoryEntry](../../interfaces/IMoldInventoryEntry.md), never&gt;

</td><td>

A materialized library of mold inventory entries, keyed by composite ID.

</td></tr>
<tr><td>

[ingredientInventory](./IUserLibraryRuntime.ingredientInventory.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[IngredientInventoryEntryId](../../type-aliases/IngredientInventoryEntryId.md), [IIngredientInventoryEntryEntity](../../interfaces/IIngredientInventoryEntryEntity.md), [IIngredientInventoryEntry](../../interfaces/IIngredientInventoryEntry.md), never&gt;

</td><td>

A materialized library of ingredient inventory entries, keyed by composite ID.

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

[createFillingSession(variationId, options)](./IUserLibraryRuntime.createFillingSession.md)

</td><td>



</td><td>

Creates a new persisted filling session from a filling variation.

</td></tr>
<tr><td>

[saveSession(sessionId)](./IUserLibraryRuntime.saveSession.md)

</td><td>



</td><td>

Saves an active session back to the library.

</td></tr>
</tbody></table>
