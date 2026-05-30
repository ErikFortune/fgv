[Home](../../README.md) > [FileTree](../README.md) > FsFileTreeAccessors

# Class: FsFileTreeAccessors

Implementation of FileTree.IMutableFileTreeAccessors that uses the
file system to access and modify files and directories.

**Implements:** [`IMutableFileTreeAccessors<TCT>`](../../interfaces/IMutableFileTreeAccessors.md)

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

`constructor(params)`

</td><td>



</td><td>

Construct a new instance of the FileTree.FsFileTreeAccessors | FsFileTreeAccessors class.

</td></tr>
</tbody></table>

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

[prefix](./FsFileTreeAccessors.prefix.md)

</td><td>

`readonly`

</td><td>

string | undefined

</td><td>

Optional path prefix to prepend to all paths.

</td></tr>
<tr><td>

[_inferContentType](./FsFileTreeAccessors._inferContentType.md)

</td><td>

`readonly`

</td><td>

(filePath: string) =&gt; Result&lt;TCT | undefined&gt;

</td><td>

Function to infer the content type of a file.

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

[resolveAbsolutePath(paths)](./FsFileTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

Resolves paths to an absolute path.

</td></tr>
<tr><td>

[getExtension(itemPath)](./FsFileTreeAccessors.getExtension.md)

</td><td>



</td><td>

Gets the extension of a path.

</td></tr>
<tr><td>

[getBaseName(itemPath, suffix)](./FsFileTreeAccessors.getBaseName.md)

</td><td>



</td><td>

Gets the base name of a path.

</td></tr>
<tr><td>

[joinPaths(paths)](./FsFileTreeAccessors.joinPaths.md)

</td><td>



</td><td>

Joins paths together.

</td></tr>
<tr><td>

[getItem(itemPath)](./FsFileTreeAccessors.getItem.md)

</td><td>



</td><td>

Gets an item from the file tree.

</td></tr>
<tr><td>

[getFileContents(filePath)](./FsFileTreeAccessors.getFileContents.md)

</td><td>



</td><td>

Gets the contents of a file in the file tree.

</td></tr>
<tr><td>

[getFileContentType(filePath, provided)](./FsFileTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

Gets the content type of a file in the file tree.

</td></tr>
<tr><td>

[getChildren(dirPath)](./FsFileTreeAccessors.getChildren.md)

</td><td>



</td><td>

Gets the children of a directory in the file tree.

</td></tr>
<tr><td>

[fileIsMutable(path)](./FsFileTreeAccessors.fileIsMutable.md)

</td><td>



</td><td>

Checks if a file at the given path can be saved.

</td></tr>
<tr><td>

[saveFileContents(path, contents)](./FsFileTreeAccessors.saveFileContents.md)

</td><td>



</td><td>

Saves the contents to a file at the given path.

</td></tr>
<tr><td>

[deleteFile(path)](./FsFileTreeAccessors.deleteFile.md)

</td><td>



</td><td>

Deletes a file at the given path.

</td></tr>
<tr><td>

[createDirectory(dirPath)](./FsFileTreeAccessors.createDirectory.md)

</td><td>



</td><td>

Creates a directory at the given path, including any missing parent directories.

</td></tr>
<tr><td>

[deleteDirectory(dirPath)](./FsFileTreeAccessors.deleteDirectory.md)

</td><td>



</td><td>

Deletes a directory at the given path.

</td></tr>
</tbody></table>
