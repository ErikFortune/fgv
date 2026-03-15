[Home](../README.md) > ICollectionOperations

# Interface: ICollectionOperations

Delegate for domain-aware collection mutations.

PersistedEditableCollection uses this interface to perform mutations
through the SubLibrary (which owns composite ID construction, validation,
and collection routing) and then automatically persists the result.

A default implementation is provided by `SubLibraryBase.getCollectionOperations()`.
Domain sub-libraries can override to add custom behavior (e.g. field-based lookups,
cross-collection validation).

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

[add(baseId, entity)](./ICollectionOperations.add.md)

</td><td>



</td><td>

Add a new entity to the collection.

</td></tr>
<tr><td>

[upsert(baseId, entity)](./ICollectionOperations.upsert.md)

</td><td>



</td><td>

Add or update an entity in the collection.

</td></tr>
<tr><td>

[remove(baseId)](./ICollectionOperations.remove.md)

</td><td>



</td><td>

Remove an entity from the collection.

</td></tr>
</tbody></table>
