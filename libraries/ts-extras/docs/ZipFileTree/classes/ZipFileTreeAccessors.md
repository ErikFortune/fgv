[Home](../../README.md) > [ZipFileTree](../README.md) > ZipFileTreeAccessors

# Class: ZipFileTreeAccessors

Read-only file tree accessors for ZIP archives.
ZIP archives are read-only by design — use FileTree.isMutableAccessors | isMutableAccessors
to check before attempting mutations.

**Implements:** `IFileTreeAccessors<TCT>`

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

[defaultInferContentType(__filePath, __provided)](./ZipFileTreeAccessors.defaultInferContentType.md)

</td><td>

`static`

</td><td>

Default function to infer the content type of a file.

</td></tr>
<tr><td>

[fromBuffer(zipBuffer, prefix)](./ZipFileTreeAccessors.fromBuffer.md)

</td><td>

`static`

</td><td>

Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (synchronous).

</td></tr>
<tr><td>

[fromBufferAsync(zipBuffer, prefix)](./ZipFileTreeAccessors.fromBufferAsync.md)

</td><td>

`static`

</td><td>

Creates a new ZipFileTreeAccessors instance from a ZIP file buffer (asynchronous).

</td></tr>
<tr><td>

[fromFile(file, params)](./ZipFileTreeAccessors.fromFile.md)

</td><td>

`static`

</td><td>

Creates a new ZipFileTreeAccessors instance from a File object (browser environment).

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./ZipFileTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

Resolves paths to an absolute path.

</td></tr>
<tr><td>

[getExtension(path)](./ZipFileTreeAccessors.getExtension.md)

</td><td>



</td><td>

Gets the extension of a path.

</td></tr>
<tr><td>

[getBaseName(path, suffix)](./ZipFileTreeAccessors.getBaseName.md)

</td><td>



</td><td>

Gets the base name of a path.

</td></tr>
<tr><td>

[joinPaths(paths)](./ZipFileTreeAccessors.joinPaths.md)

</td><td>



</td><td>

Joins paths together.

</td></tr>
<tr><td>

[getItem(path)](./ZipFileTreeAccessors.getItem.md)

</td><td>



</td><td>

Gets an item from the file tree.

</td></tr>
<tr><td>

[getFileContents(path)](./ZipFileTreeAccessors.getFileContents.md)

</td><td>



</td><td>

Gets the contents of a file in the file tree.

</td></tr>
<tr><td>

[getFileContentType(path, provided)](./ZipFileTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

Gets the content type of a file in the file tree.

</td></tr>
<tr><td>

[getChildren(path)](./ZipFileTreeAccessors.getChildren.md)

</td><td>



</td><td>

Gets the children of a directory in the file tree.

</td></tr>
</tbody></table>
