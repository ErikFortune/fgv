[Home](../README.md) > IUserLibrary

# Interface: IUserLibrary

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

[entities](./IUserLibrary.entities.md)

</td><td>

`readonly`

</td><td>

[IUserEntityLibrary](IUserEntityLibrary.md)

</td><td>

The underlying user entity library for collection management operations.

</td></tr>
<tr><td>

[sessions](./IUserLibrary.sessions.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[SessionId](../type-aliases/SessionId.md), [AnySessionEntity](../type-aliases/AnySessionEntity.md), [AnyMaterializedSession](../type-aliases/AnyMaterializedSession.md), never&gt;

</td><td>

A materialized library of all sessions, keyed by composite ID.

</td></tr>
<tr><td>

[journals](./IUserLibrary.journals.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[JournalId](../type-aliases/JournalId.md), [AnyJournalEntryEntity](../type-aliases/AnyJournalEntryEntity.md), [AnyJournalEntry](../type-aliases/AnyJournalEntry.md), never&gt;

</td><td>

A materialized library of all journal entries, keyed by composite ID.

</td></tr>
<tr><td>

[moldInventory](./IUserLibrary.moldInventory.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[MoldInventoryEntryId](../type-aliases/MoldInventoryEntryId.md), [IMoldInventoryEntryEntity](IMoldInventoryEntryEntity.md), [IMoldInventoryEntry](IMoldInventoryEntry.md), never&gt;

</td><td>

A materialized library of mold inventory entries, keyed by composite ID.

</td></tr>
<tr><td>

[ingredientInventory](./IUserLibrary.ingredientInventory.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[IngredientInventoryEntryId](../type-aliases/IngredientInventoryEntryId.md), [IIngredientInventoryEntryEntity](IIngredientInventoryEntryEntity.md), [IIngredientInventoryEntry](IIngredientInventoryEntry.md), never&gt;

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

[createPersistedFillingSession(variationId, options)](./IUserLibrary.createPersistedFillingSession.md)

</td><td>



</td><td>

Creates a new persisted filling session from a filling variation.

</td></tr>
<tr><td>

[createPersistedConfectionSession(confectionId, options)](./IUserLibrary.createPersistedConfectionSession.md)

</td><td>



</td><td>

Creates a new persisted confection session from a confection recipe.

</td></tr>
<tr><td>

[saveSession(sessionId)](./IUserLibrary.saveSession.md)

</td><td>



</td><td>

Saves an active session back to the library.

</td></tr>
</tbody></table>
