[Home](../../README.md) > [FileTree](../README.md) > InMemoryTreeAccessors

# Class: InMemoryTreeAccessors

Implementation of FileTree.IMutableFileTreeAccessors that uses an in-memory
tree to access and modify files and directories.

**Implements:** [`IMutableFileTreeAccessors<TCT>`](../../interfaces/IMutableFileTreeAccessors.md)

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

[create(files, prefix)](./InMemoryTreeAccessors.create.md)

</td><td>

`static`

</td><td>

Creates a new FileTree.InMemoryTreeAccessors | InMemoryTreeAccessors instance with the supplied

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./InMemoryTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

Resolves paths to an absolute path.

</td></tr>
<tr><td>

[getExtension(path)](./InMemoryTreeAccessors.getExtension.md)

</td><td>



</td><td>

Gets the extension of a path.

</td></tr>
<tr><td>

[getBaseName(path, suffix)](./InMemoryTreeAccessors.getBaseName.md)

</td><td>



</td><td>

Gets the base name of a path.

</td></tr>
<tr><td>

[joinPaths(paths)](./InMemoryTreeAccessors.joinPaths.md)

</td><td>



</td><td>

Joins paths together.

</td></tr>
<tr><td>

[getItem(itemPath)](./InMemoryTreeAccessors.getItem.md)

</td><td>



</td><td>

Gets an item from the file tree.

</td></tr>
<tr><td>

[getFileContents(path)](./InMemoryTreeAccessors.getFileContents.md)

</td><td>



</td><td>

Gets the contents of a file in the file tree.

</td></tr>
<tr><td>

[getFileContentType(path, provided)](./InMemoryTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

Gets the content type of a file in the file tree.

</td></tr>
<tr><td>

[getChildren(path)](./InMemoryTreeAccessors.getChildren.md)

</td><td>



</td><td>

Gets the children of a directory in the file tree.

</td></tr>
<tr><td>

[createDirectory(dirPath)](./InMemoryTreeAccessors.createDirectory.md)

</td><td>



</td><td>

Creates a directory at the given path, including any missing parent directories.

</td></tr>
<tr><td>

[fileIsMutable(path)](./InMemoryTreeAccessors.fileIsMutable.md)

</td><td>



</td><td>

Checks if a file at the given path can be saved.

</td></tr>
<tr><td>

[deleteFile(path)](./InMemoryTreeAccessors.deleteFile.md)

</td><td>



</td><td>

Deletes a file at the given path.

</td></tr>
<tr><td>

[deleteDirectory(path)](./InMemoryTreeAccessors.deleteDirectory.md)

</td><td>



</td><td>

Deletes a directory at the given path.

</td></tr>
<tr><td>

[saveFileContents(path, contents)](./InMemoryTreeAccessors.saveFileContents.md)

</td><td>



</td><td>

Saves the contents to a file at the given path.

</td></tr>
</tbody></table>
