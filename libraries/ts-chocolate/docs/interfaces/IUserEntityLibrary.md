[Home](../README.md) > IUserEntityLibrary

# Interface: IUserEntityLibrary

User-specific library data (journals, sessions, inventory).
Separate from shared library data (ingredients, recipes, etc.).

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

[journals](./IUserEntityLibrary.journals.md)

</td><td>

`readonly`

</td><td>

[JournalLibrary](../classes/JournalLibrary.md)

</td><td>

Journal library for production records.

</td></tr>
<tr><td>

[sessions](./IUserEntityLibrary.sessions.md)

</td><td>

`readonly`

</td><td>

[SessionLibrary](../classes/SessionLibrary.md)

</td><td>

Session library for persisted editing sessions.

</td></tr>
<tr><td>

[moldInventory](./IUserEntityLibrary.moldInventory.md)

</td><td>

`readonly`

</td><td>

[MoldInventoryLibrary](../classes/MoldInventoryLibrary.md)

</td><td>

Mold inventory library for tracking owned molds.

</td></tr>
<tr><td>

[ingredientInventory](./IUserEntityLibrary.ingredientInventory.md)

</td><td>

`readonly`

</td><td>

[IngredientInventoryLibrary](../classes/IngredientInventoryLibrary.md)

</td><td>

Ingredient inventory library for tracking ingredient stock.

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

[configurePersistence(config)](./IUserEntityLibrary.configurePersistence.md)

</td><td>



</td><td>

Configures persistence providers for all sub-libraries.

</td></tr>
<tr><td>

[getPersistedSessionsCollection(collectionId)](./IUserEntityLibrary.getPersistedSessionsCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted sessions collection.

</td></tr>
<tr><td>

[getPersistedJournalsCollection(collectionId)](./IUserEntityLibrary.getPersistedJournalsCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted journals collection.

</td></tr>
<tr><td>

[getPersistedMoldInventoryCollection(collectionId)](./IUserEntityLibrary.getPersistedMoldInventoryCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted mold inventory collection.

</td></tr>
<tr><td>

[getPersistedIngredientInventoryCollection(collectionId)](./IUserEntityLibrary.getPersistedIngredientInventoryCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted ingredient inventory collection.

</td></tr>
<tr><td>

[saveCollection(collectionId, encryptionProvider, subLibrary)](./IUserEntityLibrary.saveCollection.md)

</td><td>



</td><td>

Save a collection's current in-memory state to its backing file tree.

</td></tr>
</tbody></table>
