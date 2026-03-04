[Home](../../README.md) > [Editing](../README.md) > PersistedEditableCollection

# Class: PersistedEditableCollection

Persistent wrapper around EditableCollection that owns the full
save pipeline.

Key behaviors:
- **Lazy snapshot**: The underlying `EditableCollection` is created on first
  access via `EditableCollection.fromLibrary()`, not at construction.
- **Singleton identity**: Created and cached by `ChocolateEntityLibrary`,
  so all callers of a given collection share the same wrapper instance.
- **`save()` always re-snapshots**: Forces a fresh snapshot from the SubLibrary
  before serializing. This guarantees persistence reflects the current
  SubLibrary state regardless of how mutations happened.
- **Full pipeline**: `save()` handles FileTree write + optional disk sync.
- **Auto-persist mode**: When enabled, `set()` and `delete()` automatically
  trigger `save()` after each mutation.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(params)`

</td><td>



</td><td>

Creates a new persisted editable collection wrapper.

</td></tr>
</tbody></table>

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

[collectionId](./PersistedEditableCollection.collectionId.md)

</td><td>

`readonly`

</td><td>

[CollectionId](../../type-aliases/CollectionId.md)

</td><td>

The collection identifier.

</td></tr>
<tr><td>

[subLibrary](./PersistedEditableCollection.subLibrary.md)

</td><td>

`readonly`

</td><td>

[SubLibraryBase](../../classes/SubLibraryBase.md)&lt;string, TBaseId, T&gt;

</td><td>

The underlying sub-library containing the collection data.

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

[getEditable()](./PersistedEditableCollection.getEditable.md)

</td><td>



</td><td>

Access the underlying EditableCollection, lazily creating it

</td></tr>
<tr><td>

[invalidate()](./PersistedEditableCollection.invalidate.md)

</td><td>



</td><td>

Clear the cached EditableCollection, forcing a fresh snapshot
from the SubLibrary on the next access.

</td></tr>
<tr><td>

[canSave()](./PersistedEditableCollection.canSave.md)

</td><td>



</td><td>

Check whether this collection supports persistence.

</td></tr>
<tr><td>

[save()](./PersistedEditableCollection.save.md)

</td><td>



</td><td>

Persist the collection's current in-memory state to disk.

</td></tr>
<tr><td>

[set(key, value)](./PersistedEditableCollection.set.md)

</td><td>



</td><td>

Add or update an item in the collection.

</td></tr>
<tr><td>

[delete(key)](./PersistedEditableCollection.delete.md)

</td><td>



</td><td>

Delete an item from the collection.

</td></tr>
</tbody></table>
