[Home](../../README.md) > [FileTree](../README.md) > IPersistentFileTreeAccessors

# Interface: IPersistentFileTreeAccessors

Extended accessors interface that supports persistence operations.

**Extends:** [`IMutableFileTreeAccessors<TCT>`](../../interfaces/IMutableFileTreeAccessors.md)

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

[syncToDisk()](./IPersistentFileTreeAccessors.syncToDisk.md)

</td><td>



</td><td>

Synchronize all dirty files to persistent storage.

</td></tr>
<tr><td>

[isDirty()](./IPersistentFileTreeAccessors.isDirty.md)

</td><td>



</td><td>

Check if there are unsaved changes.

</td></tr>
<tr><td>

[getDirtyPaths()](./IPersistentFileTreeAccessors.getDirtyPaths.md)

</td><td>



</td><td>

Get paths of all files with unsaved changes.

</td></tr>
<tr><td>

[fileIsMutable(path)](./IMutableFileTreeAccessors.fileIsMutable.md)

</td><td>



</td><td>

Checks if a file at the given path can be saved.

</td></tr>
<tr><td>

[saveFileContents(path, contents)](./IMutableFileTreeAccessors.saveFileContents.md)

</td><td>



</td><td>

Saves the contents to a file at the given path.

</td></tr>
<tr><td>

[deleteFile(path)](./IMutableFileTreeAccessors.deleteFile.md)

</td><td>



</td><td>

Deletes a file at the given path.

</td></tr>
<tr><td>

[createDirectory(path)](./IMutableFileTreeAccessors.createDirectory.md)

</td><td>



</td><td>

Creates a directory at the given path, including any missing parent directories.

</td></tr>
<tr><td>

[deleteDirectory(path)](./IMutableFileTreeAccessors.deleteDirectory.md)

</td><td>



</td><td>

Deletes a directory at the given path.

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./IMutableFileTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

Resolves paths to an absolute path.

</td></tr>
<tr><td>

[getExtension(path)](./IMutableFileTreeAccessors.getExtension.md)

</td><td>



</td><td>

Gets the extension of a path.

</td></tr>
<tr><td>

[getBaseName(path, suffix)](./IMutableFileTreeAccessors.getBaseName.md)

</td><td>



</td><td>

Gets the base name of a path.

</td></tr>
<tr><td>

[joinPaths(paths)](./IMutableFileTreeAccessors.joinPaths.md)

</td><td>



</td><td>

Joins paths together.

</td></tr>
<tr><td>

[getItem(path)](./IMutableFileTreeAccessors.getItem.md)

</td><td>



</td><td>

Gets an item from the file tree.

</td></tr>
<tr><td>

[getFileContents(path)](./IMutableFileTreeAccessors.getFileContents.md)

</td><td>



</td><td>

Gets the contents of a file in the file tree.

</td></tr>
<tr><td>

[getFileContentType(path, provided)](./IMutableFileTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

Gets the content type of a file in the file tree.

</td></tr>
<tr><td>

[getChildren(path)](./IMutableFileTreeAccessors.getChildren.md)

</td><td>



</td><td>

Gets the children of a directory in the file tree.

</td></tr>
</tbody></table>
