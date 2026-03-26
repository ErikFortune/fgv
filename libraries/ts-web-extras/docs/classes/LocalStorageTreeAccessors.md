[Home](../README.md) > LocalStorageTreeAccessors

# Class: LocalStorageTreeAccessors

Browser localStorage-backed file tree accessors with persistence support.

Maps filesystem-like directory paths to localStorage keys, where each key stores
multiple collections as a JSON object. This provides a general-purpose implementation
for browser-based file tree persistence without requiring File System Access API.

Storage format per key: `{ "collection-id": "<raw file content>" }`
File paths map as: `/data/ingredients/collection-id.yaml` → stored in key for `/data/ingredients`

Legacy format (v1): `{ "collection-id": { ...parsedJsonObject } }` is auto-migrated on load.

**Extends:** `InMemoryTreeAccessors<TCT>`

**Implements:** `IPersistentFileTreeAccessors<TCT>`

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

[fromStorage(params)](./LocalStorageTreeAccessors.fromStorage.md)

</td><td>

`static`

</td><td>

Create LocalStorageTreeAccessors from browser localStorage.

</td></tr>
<tr><td>

[create(files, prefix)](./LocalStorageTreeAccessors.create.md)

</td><td>

`static`

</td><td>

Creates a new FileTree.InMemoryTreeAccessors | InMemoryTreeAccessors instance with the supplied

</td></tr>
<tr><td>

[syncToDisk()](./LocalStorageTreeAccessors.syncToDisk.md)

</td><td>



</td><td>

Sync all dirty files to localStorage.

</td></tr>
<tr><td>

[isDirty()](./LocalStorageTreeAccessors.isDirty.md)

</td><td>



</td><td>

Check if there are unsaved changes.

</td></tr>
<tr><td>

[getDirtyPaths()](./LocalStorageTreeAccessors.getDirtyPaths.md)

</td><td>



</td><td>

Get list of file paths with unsaved changes.

</td></tr>
<tr><td>

[deleteFile(path)](./LocalStorageTreeAccessors.deleteFile.md)

</td><td>



</td><td>

Delete a file and remove it from localStorage.

</td></tr>
<tr><td>

[saveFileContents(path, contents)](./LocalStorageTreeAccessors.saveFileContents.md)

</td><td>



</td><td>

Save file contents.

</td></tr>
<tr><td>

[fileIsMutable(path)](./LocalStorageTreeAccessors.fileIsMutable.md)

</td><td>



</td><td>

Check if a file is mutable and return persistence detail.

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./LocalStorageTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.resolveAbsolutePath

</td></tr>
<tr><td>

[getExtension(path)](./LocalStorageTreeAccessors.getExtension.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getExtension

</td></tr>
<tr><td>

[getBaseName(path, suffix)](./LocalStorageTreeAccessors.getBaseName.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getBaseName

</td></tr>
<tr><td>

[joinPaths(paths)](./LocalStorageTreeAccessors.joinPaths.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.joinPaths

</td></tr>
<tr><td>

[getItem(itemPath)](./LocalStorageTreeAccessors.getItem.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getItem

</td></tr>
<tr><td>

[getFileContents(path)](./LocalStorageTreeAccessors.getFileContents.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getFileContents

</td></tr>
<tr><td>

[getFileContentType(path, provided)](./LocalStorageTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getFileContentType

</td></tr>
<tr><td>

[getChildren(path)](./LocalStorageTreeAccessors.getChildren.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getChildren

</td></tr>
<tr><td>

[createDirectory(dirPath)](./LocalStorageTreeAccessors.createDirectory.md)

</td><td>



</td><td>

FileTree.IMutableFileTreeAccessors.createDirectory

</td></tr>
<tr><td>

[deleteDirectory(path)](./LocalStorageTreeAccessors.deleteDirectory.md)

</td><td>



</td><td>

FileTree.IMutableFileTreeAccessors.deleteDirectory

</td></tr>
</tbody></table>
