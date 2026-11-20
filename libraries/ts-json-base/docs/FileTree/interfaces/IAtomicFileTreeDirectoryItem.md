[Home](../../README.md) > [FileTree](../README.md) > IAtomicFileTreeDirectoryItem

# Interface: IAtomicFileTreeDirectoryItem

Extended directory item interface for directories that can atomically
write a child file, without the caller ever seeing a native path or
reaching into accessor internals.

**Extends:** [`IMutableFileTreeDirectoryItem<TCT>`](../../interfaces/IMutableFileTreeDirectoryItem.md)

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

[type](./IMutableFileTreeDirectoryItem.type.md)

</td><td>

`readonly`

</td><td>

"directory"

</td><td>

Indicates that this FileTree.FileTreeItem | file tree item is a directory

</td></tr>
<tr><td>

[absolutePath](./IMutableFileTreeDirectoryItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the directory.

</td></tr>
<tr><td>

[name](./IMutableFileTreeDirectoryItem.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the directory

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

[getAtomicWriteCapabilities()](./IAtomicFileTreeDirectoryItem.getAtomicWriteCapabilities.md)

</td><td>



</td><td>

Reports what atomic replacement this directory's backing store can

</td></tr>
<tr><td>

[writeChildAtomically(name, contents, options)](./IAtomicFileTreeDirectoryItem.writeChildAtomically.md)

</td><td>



</td><td>

Atomically writes (creating or replacing) a child file of this

</td></tr>
<tr><td>

[cleanupAtomicTemporaries()](./IAtomicFileTreeDirectoryItem.cleanupAtomicTemporaries.md)

</td><td>



</td><td>

Removes any working files this store reserves for interrupted atomic

</td></tr>
<tr><td>

[createChildFile(name, contents)](./IMutableFileTreeDirectoryItem.createChildFile.md)

</td><td>



</td><td>

Creates a new file as a child of this directory.

</td></tr>
<tr><td>

[createChildDirectory(name)](./IMutableFileTreeDirectoryItem.createChildDirectory.md)

</td><td>



</td><td>

Creates a new subdirectory as a child of this directory.

</td></tr>
<tr><td>

[deleteChild(name, options)](./IMutableFileTreeDirectoryItem.deleteChild.md)

</td><td>



</td><td>

Deletes a child item from this directory.

</td></tr>
<tr><td>

[delete()](./IMutableFileTreeDirectoryItem.delete.md)

</td><td>



</td><td>

Deletes this directory from its backing store.

</td></tr>
<tr><td>

[getChildren()](./IMutableFileTreeDirectoryItem.getChildren.md)

</td><td>



</td><td>

Gets the children of the directory.

</td></tr>
<tr><td>

[getStorageIdentity()](./IMutableFileTreeDirectoryItem.getStorageIdentity.md)

</td><td>



</td><td>

Says what storage this directory names, so a consumer can tell whether two
directory items reach the same place.

</td></tr>
</tbody></table>
