[Home](../README.md) > FileSystemAccessTreeAccessors

# Class: FileSystemAccessTreeAccessors

Implementation of `FileTree.IPersistentFileTreeAccessors` that uses the File System Access API
to provide persistent file editing in browsers.

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

[fromDirectoryHandle(dirHandle, params)](./FileSystemAccessTreeAccessors.fromDirectoryHandle.md)

</td><td>

`static`

</td><td>

Creates a new FileSystemAccessTreeAccessors instance from a directory handle.

</td></tr>
<tr><td>

[fromFileHandle(fileHandle, params)](./FileSystemAccessTreeAccessors.fromFileHandle.md)

</td><td>

`static`

</td><td>

Creates a new FileSystemAccessTreeAccessors instance from a single file handle.

</td></tr>
<tr><td>

[create(files, prefix)](./FileSystemAccessTreeAccessors.create.md)

</td><td>

`static`

</td><td>

Creates a new FileTree.InMemoryTreeAccessors | InMemoryTreeAccessors instance with the supplied

</td></tr>
<tr><td>

[syncToDisk()](./FileSystemAccessTreeAccessors.syncToDisk.md)

</td><td>



</td><td>

Implements `FileTree.IPersistentFileTreeAccessors.syncToDisk`

</td></tr>
<tr><td>

[isDirty()](./FileSystemAccessTreeAccessors.isDirty.md)

</td><td>



</td><td>

Implements `FileTree.IPersistentFileTreeAccessors.isDirty`

</td></tr>
<tr><td>

[getDirtyPaths()](./FileSystemAccessTreeAccessors.getDirtyPaths.md)

</td><td>



</td><td>

Implements `FileTree.IPersistentFileTreeAccessors.getDirtyPaths`

</td></tr>
<tr><td>

[deleteFile(path)](./FileSystemAccessTreeAccessors.deleteFile.md)

</td><td>



</td><td>

Override deleteFile to track pending deletions for syncToDisk.

</td></tr>
<tr><td>

[saveFileContents(path, contents)](./FileSystemAccessTreeAccessors.saveFileContents.md)

</td><td>



</td><td>

Implements `FileTree.IMutableFileTreeAccessors.saveFileContents`

</td></tr>
<tr><td>

[fileIsMutable(path)](./FileSystemAccessTreeAccessors.fileIsMutable.md)

</td><td>



</td><td>

Implements `FileTree.IMutableFileTreeAccessors.fileIsMutable`

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./FileSystemAccessTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.resolveAbsolutePath

</td></tr>
<tr><td>

[getExtension(path)](./FileSystemAccessTreeAccessors.getExtension.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getExtension

</td></tr>
<tr><td>

[getBaseName(path, suffix)](./FileSystemAccessTreeAccessors.getBaseName.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getBaseName

</td></tr>
<tr><td>

[joinPaths(paths)](./FileSystemAccessTreeAccessors.joinPaths.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.joinPaths

</td></tr>
<tr><td>

[getItem(itemPath)](./FileSystemAccessTreeAccessors.getItem.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getItem

</td></tr>
<tr><td>

[getFileContents(path)](./FileSystemAccessTreeAccessors.getFileContents.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getFileContents

</td></tr>
<tr><td>

[getFileContentType(path, provided)](./FileSystemAccessTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getFileContentType

</td></tr>
<tr><td>

[getChildren(path)](./FileSystemAccessTreeAccessors.getChildren.md)

</td><td>



</td><td>

FileTree.IFileTreeAccessors.getChildren

</td></tr>
<tr><td>

[createDirectory(dirPath)](./FileSystemAccessTreeAccessors.createDirectory.md)

</td><td>



</td><td>

FileTree.IMutableFileTreeAccessors.createDirectory

</td></tr>
<tr><td>

[deleteDirectory(path)](./FileSystemAccessTreeAccessors.deleteDirectory.md)

</td><td>



</td><td>

FileTree.IMutableFileTreeAccessors.deleteDirectory

</td></tr>
</tbody></table>
