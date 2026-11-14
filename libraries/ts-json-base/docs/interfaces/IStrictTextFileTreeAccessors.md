[Home](../README.md) > IStrictTextFileTreeAccessors

# Interface: IStrictTextFileTreeAccessors

Extended accessors for stores that can decode a file's text **strictly** —
failing on malformed UTF-8 instead of substituting U+FFFD.

**Extends:** [`IFileTreeAccessors<TCT>`](IFileTreeAccessors.md)

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

[getFileTextStrict(path)](./IStrictTextFileTreeAccessors.getFileTextStrict.md)

</td><td>



</td><td>

Reads a file's contents, decoding UTF-8 strictly.

</td></tr>
<tr><td>

[resolveAbsolutePath(paths)](./IFileTreeAccessors.resolveAbsolutePath.md)

</td><td>



</td><td>

Resolves paths to an absolute path.

</td></tr>
<tr><td>

[resolveRealPath(path)](./IFileTreeAccessors.resolveRealPath.md)

</td><td>



</td><td>

Resolves a path to its canonical real path, with every symbolic link
resolved.

</td></tr>
<tr><td>

[getExtension(path)](./IFileTreeAccessors.getExtension.md)

</td><td>



</td><td>

Gets the extension of a path.

</td></tr>
<tr><td>

[getBaseName(path, suffix)](./IFileTreeAccessors.getBaseName.md)

</td><td>



</td><td>

Gets the base name of a path.

</td></tr>
<tr><td>

[joinPaths(paths)](./IFileTreeAccessors.joinPaths.md)

</td><td>



</td><td>

Joins paths together.

</td></tr>
<tr><td>

[getItem(path)](./IFileTreeAccessors.getItem.md)

</td><td>



</td><td>

Gets an item from the file tree.

</td></tr>
<tr><td>

[getFileContents(path)](./IFileTreeAccessors.getFileContents.md)

</td><td>



</td><td>

Gets the contents of a file in the file tree.

</td></tr>
<tr><td>

[getFileContentType(path, provided)](./IFileTreeAccessors.getFileContentType.md)

</td><td>



</td><td>

Gets the content type of a file in the file tree.

</td></tr>
<tr><td>

[getChildren(path)](./IFileTreeAccessors.getChildren.md)

</td><td>



</td><td>

Gets the children of a directory in the file tree.

</td></tr>
</tbody></table>
