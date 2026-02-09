[Home](../../README.md) > [UserLibrary](../README.md) > UserLibrary

# Class: UserLibrary

Implementation of user library runtime materialization.

Follows the library-runtime pattern:
- Exposes MaterializedLibrary instances for sessions, journals, and inventory
- Lazy resolution and caching of materialized objects
- Specialized methods for session creation and persistence
- Implements ISessionContext for confection editing sessions

**Implements:** [`IUserLibrary`](../../interfaces/IUserLibrary.md), [`ISessionContext`](../../interfaces/ISessionContext.md)

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
<tr><td>

[fillings](./UserLibrary.fillings.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[FillingId](../../type-aliases/FillingId.md), [IFillingRecipeEntity](../../interfaces/IFillingRecipeEntity.md), [IFillingRecipe](../../interfaces/IFillingRecipe.md), [IFillingRecipeQuerySpec](../../interfaces/IFillingRecipeQuerySpec.md)&gt;

</td><td>

Gets the materialized fillings library from the confection context.

</td></tr>
<tr><td>

[confections](./UserLibrary.confections.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[ConfectionId](../../type-aliases/ConfectionId.md), [AnyConfectionRecipeEntity](../../type-aliases/AnyConfectionRecipeEntity.md), [IConfectionBase](../../interfaces/IConfectionBase.md)&lt;[AnyConfectionRecipeVariation](../../type-aliases/AnyConfectionRecipeVariation.md), [AnyConfectionRecipeEntity](../../type-aliases/AnyConfectionRecipeEntity.md)&gt;, never&gt;

</td><td>

Gets the materialized confections library from the confection context.

</td></tr>
<tr><td>

[molds](./UserLibrary.molds.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[MoldId](../../type-aliases/MoldId.md), [IMoldEntity](../../interfaces/IMoldEntity.md), [IMold](../../interfaces/IMold.md), never&gt;

</td><td>

Gets the materialized molds library from the confection context.

</td></tr>
<tr><td>

[ingredients](./UserLibrary.ingredients.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[IngredientId](../../type-aliases/IngredientId.md), [IngredientEntity](../../type-aliases/IngredientEntity.md), [IIngredient](../../interfaces/IIngredient.md)&lt;[IngredientEntity](../../type-aliases/IngredientEntity.md)&gt;, [IIngredientQuerySpec](../../interfaces/IIngredientQuerySpec.md)&gt;

</td><td>

Gets the materialized ingredients library from the confection context.

</td></tr>
<tr><td>

[procedures](./UserLibrary.procedures.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[ProcedureId](../../type-aliases/ProcedureId.md), [IProcedureEntity](../../interfaces/IProcedureEntity.md), [IProcedure](../../interfaces/IProcedure.md), never&gt;

</td><td>

Gets the materialized procedures library from the confection context.

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

[create(userEntityLibrary, confectionContext)](./UserLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new UserLibrary.

</td></tr>
<tr><td>

[createFillingSession(filling, targetWeight)](./UserLibrary.createFillingSession.md)

</td><td>



</td><td>

Creates an editing session for a filling recipe at a target weight.

</td></tr>
<tr><td>

[isCollectionMutable(collectionId)](./UserLibrary.isCollectionMutable.md)

</td><td>



</td><td>

Checks if a collection is mutable.

</td></tr>
<tr><td>

[createPersistedFillingSession(variationId, options)](./UserLibrary.createPersistedFillingSession.md)

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
