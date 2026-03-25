[Home](../README.md) > HttpTreeAccessors

# Class: HttpTreeAccessors

HTTP-backed file tree accessors that cache data in memory and persist via REST API.

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

[fromHttp(params)](./HttpTreeAccessors.fromHttp.md)

</td><td>

`static`

</td><td>

Creates a new HttpTreeAccessors instance from an HTTP backend.

</td></tr>
<tr><td>

[create(files, prefix)](./HttpTreeAccessors.create.md)

</td><td>

`static`

</td><td>

Creates a new FileTree.InMemoryTreeAccessors | InMemoryTreeAccessors instance with the supplied

</td></tr>
<tr><td>

[syncToDisk()](./HttpTreeAccessors.syncToDisk.md)

</td><td>



</td><td>

Synchronizes all dirty files to the HTTP backend.

</td></tr>
<tr><td>

[isDirty()](./HttpTreeAccessors.isDirty.md)

</td><td>



</td><td>

Checks if there are any dirty files that need synchronization.

</td></tr>
<tr><td>

[getDirtyPaths()](./HttpTreeAccessors.getDirtyPaths.md)

</td><td>



</td><td>

Gets the list of paths for all dirty files.

</td></tr>
<tr><td>

[deleteFile(path)](./HttpTreeAccessors.deleteFile.md)

</td><td>



</td><td>

FileTree.IMutableFileTreeAccessors.deleteFile

</td></tr>
<tr><td>

[saveFileContents(path, contents)](./HttpTreeAccessors.saveFileContents.md)

</td><td>



</td><td>

Saves file contents and marks the file as dirty for synchronization.

</td></tr>
<tr><td>

[fileIsMutable(path)](./HttpTreeAccessors.fileIsMutable.md)

</td><td>



</td><td>

Checks if a file is mutable (can be modified).

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./HttpTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.resolveAbsolutePath

</td></tr>
<tr><td>

[getExtension(path)](./HttpTreeAccessors.getExtension.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getExtension

</td></tr>
<tr><td>

[getBaseName(path, suffix)](./HttpTreeAccessors.getBaseName.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getBaseName

</td></tr>
<tr><td>

[joinPaths(paths)](./HttpTreeAccessors.joinPaths.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.joinPaths

</td></tr>
<tr><td>

[getItem(itemPath)](./HttpTreeAccessors.getItem.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getItem

</td></tr>
<tr><td>

[getFileContents(path)](./HttpTreeAccessors.getFileContents.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getFileContents

</td></tr>
<tr><td>

[getFileContentType(path, provided)](./HttpTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getFileContentType

</td></tr>
<tr><td>

[getChildren(path)](./HttpTreeAccessors.getChildren.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getChildren

</td></tr>
<tr><td>

[createDirectory(dirPath)](./HttpTreeAccessors.createDirectory.md)

</td><td>



</td><td>

FileTree.IMutableFileTreeAccessors.createDirectory

</td></tr>
<tr><td>

[deleteDirectory(path)](./HttpTreeAccessors.deleteDirectory.md)

</td><td>



</td><td>

FileTree.IMutableFileTreeAccessors.deleteDirectory

</td></tr>
</tbody></table>
