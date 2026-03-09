[Home](../README.md) > UserEntityLibrary

# Class: UserEntityLibrary

Aggregates user-specific data entity libraries.

Unlike ChocolateEntityLibrary (shared data), UserEntityLibrary contains only
user/installation-specific data with no built-in collections.

**Implements:** [`IUserEntityLibrary`](../interfaces/IUserEntityLibrary.md)

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

[logger](./UserEntityLibrary.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown&gt;

</td><td>

Logger used by this library and its sub-libraries.

</td></tr>
<tr><td>

[journals](./UserEntityLibrary.journals.md)

</td><td>

`readonly`

</td><td>

[JournalLibrary](JournalLibrary.md)

</td><td>

Journal library for production records.

</td></tr>
<tr><td>

[sessions](./UserEntityLibrary.sessions.md)

</td><td>

`readonly`

</td><td>

[SessionLibrary](SessionLibrary.md)

</td><td>

Session library for persisted editing sessions.

</td></tr>
<tr><td>

[moldInventory](./UserEntityLibrary.moldInventory.md)

</td><td>

`readonly`

</td><td>

[MoldInventoryLibrary](MoldInventoryLibrary.md)

</td><td>

Mold inventory library for tracking owned molds.

</td></tr>
<tr><td>

[ingredientInventory](./UserEntityLibrary.ingredientInventory.md)

</td><td>

`readonly`

</td><td>

[IngredientInventoryLibrary](IngredientInventoryLibrary.md)

</td><td>

Ingredient inventory library for tracking ingredient stock.

</td></tr>
<tr><td>

[locations](./UserEntityLibrary.locations.md)

</td><td>

`readonly`

</td><td>

[LocationsLibrary](LocationsLibrary.md)

</td><td>

Locations library for tracking production locations.

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

[create(params)](./UserEntityLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new UserEntities.UserEntityLibrary | UserEntityLibrary instance.

</td></tr>
<tr><td>

[configurePersistence(config)](./UserEntityLibrary.configurePersistence.md)

</td><td>



</td><td>

Configures persistence providers for all sub-libraries.

</td></tr>
<tr><td>

[getPersistedSessionsCollection(collectionId)](./UserEntityLibrary.getPersistedSessionsCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted sessions collection.

</td></tr>
<tr><td>

[getPersistedJournalsCollection(collectionId)](./UserEntityLibrary.getPersistedJournalsCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted journals collection.

</td></tr>
<tr><td>

[getPersistedMoldInventoryCollection(collectionId)](./UserEntityLibrary.getPersistedMoldInventoryCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted mold inventory collection.

</td></tr>
<tr><td>

[getPersistedIngredientInventoryCollection(collectionId)](./UserEntityLibrary.getPersistedIngredientInventoryCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted ingredient inventory collection.

</td></tr>
<tr><td>

[getPersistedLocationsCollection(collectionId)](./UserEntityLibrary.getPersistedLocationsCollection.md)

</td><td>



</td><td>

Get or create a singleton persisted locations collection.

</td></tr>
<tr><td>

[saveCollection(collectionId, encryptionProvider, subLibrary)](./UserEntityLibrary.saveCollection.md)

</td><td>



</td><td>

Save a collection's current in-memory state to its backing file tree.

</td></tr>
</tbody></table>
