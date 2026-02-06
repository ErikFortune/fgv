[Home](../../README.md) > [UserRuntime](../README.md) > UserLibrary

# Class: UserLibrary

Implementation of user library runtime materialization.

Follows the library-runtime pattern:
- Exposes MaterializedLibrary instances for sessions, journals, and inventory
- Lazy resolution and caching of materialized objects
- Specialized methods for session creation and persistence

**Implements:** [`IUserLibrary`](../../interfaces/IUserLibrary.md)

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

[sessions](./UserLibrary.sessions.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[SessionId](../../type-aliases/SessionId.md), [AnySessionEntity](../../type-aliases/AnySessionEntity.md), [AnyMaterializedSession](../../type-aliases/AnyMaterializedSession.md), never&gt;

</td><td>

A materialized library of all sessions, keyed by composite ID.

</td></tr>
<tr><td>

[journals](./UserLibrary.journals.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[JournalId](../../type-aliases/JournalId.md), [AnyJournalEntryEntity](../../type-aliases/AnyJournalEntryEntity.md), [AnyJournalEntry](../../type-aliases/AnyJournalEntry.md), never&gt;

</td><td>

A materialized library of all journal entries, keyed by composite ID.

</td></tr>
<tr><td>

[moldInventory](./UserLibrary.moldInventory.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[MoldInventoryEntryId](../../type-aliases/MoldInventoryEntryId.md), [IMoldInventoryEntryEntity](../../interfaces/IMoldInventoryEntryEntity.md), [IMoldInventoryEntry](../../interfaces/IMoldInventoryEntry.md), never&gt;

</td><td>

A materialized library of mold inventory entries, keyed by composite ID.

</td></tr>
<tr><td>

[ingredientInventory](./UserLibrary.ingredientInventory.md)

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

[create(userEntityLibrary, sessionContext)](./UserLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new UserLibrary.

</td></tr>
<tr><td>

[createFillingSession(variationId, options)](./UserLibrary.createFillingSession.md)

</td><td>



</td><td>

Creates a new persisted filling session from a filling variation.

</td></tr>
<tr><td>

[saveSession(sessionId)](./UserLibrary.saveSession.md)

</td><td>



</td><td>

Saves an active session back to the library.

</td></tr>
</tbody></table>
