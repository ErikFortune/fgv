[Home](../../README.md) > [FileTree](../README.md) > DirectoryItem

# Class: DirectoryItem

Class representing a directory in a file tree.

**Implements:** [`IMutableBinaryFileTreeDirectoryItem<TCT>`](../../interfaces/IMutableBinaryFileTreeDirectoryItem.md), [`IAtomicFileTreeDirectoryItem<TCT>`](../../interfaces/IAtomicFileTreeDirectoryItem.md)

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

[type](./DirectoryItem.type.md)

</td><td>

`readonly`

</td><td>

"directory"

</td><td>

Indicates that this FileTree.FileTreeItem | file tree item is a directory

</td></tr>
<tr><td>

[absolutePath](./DirectoryItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the directory.

</td></tr>
<tr><td>

[_hal](./DirectoryItem._hal.md)

</td><td>

`readonly`

</td><td>

[IFileTreeAccessors](../../interfaces/IFileTreeAccessors.md)&lt;TCT&gt;

</td><td>

The FileTree.IFileTreeAccessors | accessors to use for file system operations.

</td></tr>
<tr><td>

[name](./DirectoryItem.name.md)

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

[create(path, hal)](./DirectoryItem.create.md)

</td><td>

`static`

</td><td>

Creates a new DirectoryItem instance.

</td></tr>
<tr><td>

[getChildren()](./DirectoryItem.getChildren.md)

</td><td>



</td><td>

Gets the children of the directory.

</td></tr>
<tr><td>

[createChildFile(name, contents)](./DirectoryItem.createChildFile.md)

</td><td>



</td><td>

Creates a new file as a child of this directory.

</td></tr>
<tr><td>

[canCreateChildFileBytes()](./DirectoryItem.canCreateChildFileBytes.md)

</td><td>



</td><td>

Reports whether the backing store can persist bytes verbatim.

</td></tr>
<tr><td>

[createChildFileBytes(name, bytes)](./DirectoryItem.createChildFileBytes.md)

</td><td>



</td><td>

Creates a new file as a child of this directory from raw bytes, with no text

</td></tr>
<tr><td>

[getStorageIdentity()](./DirectoryItem.getStorageIdentity.md)

</td><td>



</td><td>

Says what storage this directory names, so a consumer can tell whether two
directory items reach the same place.

</td></tr>
<tr><td>

[getAtomicWriteCapabilities()](./DirectoryItem.getAtomicWriteCapabilities.md)

</td><td>



</td><td>

Reports what atomic replacement this directory's backing store can

</td></tr>
<tr><td>

[writeChildAtomically(name, contents, options)](./DirectoryItem.writeChildAtomically.md)

</td><td>



</td><td>

Atomically writes (creating or replacing) a child file of this

</td></tr>
<tr><td>

[cleanupAtomicTemporaries()](./DirectoryItem.cleanupAtomicTemporaries.md)

</td><td>



</td><td>

Removes any working files this store reserves for interrupted atomic

</td></tr>
<tr><td>

[createChildDirectory(name)](./DirectoryItem.createChildDirectory.md)

</td><td>



</td><td>

Creates a new subdirectory as a child of this directory.

</td></tr>
<tr><td>

[deleteChild(name, options)](./DirectoryItem.deleteChild.md)

</td><td>



</td><td>

Deletes a child item from this directory.

</td></tr>
<tr><td>

[delete()](./DirectoryItem.delete.md)

</td><td>



</td><td>

Deletes this directory from its backing store.

</td></tr>
</tbody></table>
