[Home](../README.md) > DirectoryHandleStore

# Class: DirectoryHandleStore

Manages persistence of FileSystemDirectoryHandle objects in IndexedDB.
Keyed by a label (typically the directory name).

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

`constructor(dbName, storeName)`

</td><td>



</td><td>



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

[save(label, handle)](./DirectoryHandleStore.save.md)

</td><td>



</td><td>

Saves a directory handle to IndexedDB under the given label.

</td></tr>
<tr><td>

[load(label)](./DirectoryHandleStore.load.md)

</td><td>



</td><td>

Retrieves a directory handle by label.

</td></tr>
<tr><td>

[remove(label)](./DirectoryHandleStore.remove.md)

</td><td>



</td><td>

Removes a directory handle from IndexedDB.

</td></tr>
<tr><td>

[getAllLabels()](./DirectoryHandleStore.getAllLabels.md)

</td><td>



</td><td>

Returns all stored labels (keys).

</td></tr>
<tr><td>

[getAll()](./DirectoryHandleStore.getAll.md)

</td><td>



</td><td>

Returns all stored handles as label/handle pairs.

</td></tr>
</tbody></table>
