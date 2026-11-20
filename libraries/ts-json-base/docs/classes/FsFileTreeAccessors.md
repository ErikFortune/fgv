[Home](../README.md) > FsFileTreeAccessors

# Class: FsFileTreeAccessors

Implementation of FileTree.IMutableBinaryFileTreeAccessors that uses the
file system to access and modify files and directories.

**Implements:** [`IMutableBinaryFileTreeAccessors<TCT>`](../interfaces/IMutableBinaryFileTreeAccessors.md), [`IAtomicFileTreeAccessors<TCT>`](../interfaces/IAtomicFileTreeAccessors.md)

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

Optional root of the tree.

</td></tr>
<tr><td>

[absolutePathPolicy](./FsFileTreeAccessors.absolutePathPolicy.md)

</td><td>

`readonly`

</td><td>

[FsAbsolutePathPolicy](../type-aliases/FsAbsolutePathPolicy.md)

</td><td>

How a path that resolves outside FileTree.FsFileTreeAccessors.prefix | prefix
is treated.

</td></tr>
<tr><td>

[realPath](./FsFileTreeAccessors.realPath.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether every operation also checks the real path — symbolic links

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

[create(params)](./FsFileTreeAccessors.create.md)

</td><td>

`static`

</td><td>

Creates a new FileTree.FsFileTreeAccessors | FsFileTreeAccessors.

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./FsFileTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

Resolves paths to an absolute path.

</td></tr>
<tr><td>

[resolveRealPath(itemPath)](./FsFileTreeAccessors.resolveRealPath.md)

</td><td>



</td><td>

Resolves a path to its canonical real path, with every symbolic link
resolved.

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

[getFileBytes(filePath)](./FsFileTreeAccessors.getFileBytes.md)

</td><td>



</td><td>

Gets the contents of a file in the file tree as bytes, with no text decoding applied.

</td></tr>
<tr><td>

[getFileTextStrict(filePath)](./FsFileTreeAccessors.getFileTextStrict.md)

</td><td>



</td><td>

Reads a file's contents, decoding UTF-8 strictly.

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

[saveFileBytes(path, bytes)](./FsFileTreeAccessors.saveFileBytes.md)

</td><td>



</td><td>

Saves bytes to a file at the given path, with no text encoding applied.

</td></tr>
<tr><td>

[getAtomicWriteCapabilities(directory)](./FsFileTreeAccessors.getAtomicWriteCapabilities.md)

</td><td>



</td><td>

Reports what atomic replacement this store can offer for writes into the

</td></tr>
<tr><td>

[writeFileAtomically(filePath, contents, options)](./FsFileTreeAccessors.writeFileAtomically.md)

</td><td>



</td><td>

Replaces (or creates) a file's contents such that a reader never

</td></tr>
<tr><td>

[cleanupAtomicTemporaries(directory)](./FsFileTreeAccessors.cleanupAtomicTemporaries.md)

</td><td>



</td><td>

Removes any working files this store reserves for interrupted atomic

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
