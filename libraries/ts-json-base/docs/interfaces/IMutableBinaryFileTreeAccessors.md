[Home](../README.md) > IMutableBinaryFileTreeAccessors

# Interface: IMutableBinaryFileTreeAccessors

Extended accessors interface for trees whose file contents can be both read and
written as raw bytes.

**Extends:** [`IBinaryFileTreeAccessors<TCT>`](IBinaryFileTreeAccessors.md), [`IMutableFileTreeAccessors<TCT>`](IMutableFileTreeAccessors.md)

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

[saveFileBytes(path, bytes)](./IMutableBinaryFileTreeAccessors.saveFileBytes.md)

</td><td>



</td><td>

Saves bytes to a file at the given path, with no text encoding applied.

</td></tr>
<tr><td>

[getFileBytes(path)](./IBinaryFileTreeAccessors.getFileBytes.md)

</td><td>



</td><td>

Gets the contents of a file in the file tree as bytes, with no text decoding applied.

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./IBinaryFileTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

Resolves paths to an absolute path.

</td></tr>
<tr><td>

[resolveRealPath(path)](./IBinaryFileTreeAccessors.resolveRealPath.md)

</td><td>



</td><td>

Resolves a path to its canonical real path, with every symbolic link
resolved.

</td></tr>
<tr><td>

[getExtension(path)](./IBinaryFileTreeAccessors.getExtension.md)

</td><td>



</td><td>

Gets the extension of a path.

</td></tr>
<tr><td>

[getBaseName(path, suffix)](./IBinaryFileTreeAccessors.getBaseName.md)

</td><td>



</td><td>

Gets the base name of a path.

</td></tr>
<tr><td>

[joinPaths(paths)](./IBinaryFileTreeAccessors.joinPaths.md)

</td><td>



</td><td>

Joins paths together.

</td></tr>
<tr><td>

[getItem(path)](./IBinaryFileTreeAccessors.getItem.md)

</td><td>



</td><td>

Gets an item from the file tree.

</td></tr>
<tr><td>

[getFileContents(path)](./IBinaryFileTreeAccessors.getFileContents.md)

</td><td>



</td><td>

Gets the contents of a file in the file tree.

</td></tr>
<tr><td>

[getFileContentType(path, provided)](./IBinaryFileTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

Gets the content type of a file in the file tree.

</td></tr>
<tr><td>

[getChildren(path)](./IBinaryFileTreeAccessors.getChildren.md)

</td><td>



</td><td>

Gets the children of a directory in the file tree.

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
</tbody></table>
