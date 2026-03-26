[Home](../README.md) > IFileSystemAccessTreeParams

# Interface: IFileSystemAccessTreeParams

Options for creating persistent file trees.

**Extends:** `IFileTreeInitParams<TCT>`

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

[autoSync](./IFileSystemAccessTreeParams.autoSync.md)

</td><td>



</td><td>

boolean

</td><td>

Automatically sync changes to disk immediately after each save.

</td></tr>
<tr><td>

[requireWritePermission](./IFileSystemAccessTreeParams.requireWritePermission.md)

</td><td>



</td><td>

boolean

</td><td>

Require write permission on the directory handle.

</td></tr>
<tr><td>

[filePath](./IFileSystemAccessTreeParams.filePath.md)

</td><td>



</td><td>

string

</td><td>

Override the path at which the file is stored in the tree (for fromFileHandle).

</td></tr>
<tr><td>

[logger](./IFileSystemAccessTreeParams.logger.md)

</td><td>



</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>

Optional logger for auto-sync and persistence failures.

</td></tr>
<tr><td>

[prefix](./IFileSystemAccessTreeParams.prefix.md)

</td><td>



</td><td>

string

</td><td>



</td></tr>
<tr><td>

[inferContentType](./IFileSystemAccessTreeParams.inferContentType.md)

</td><td>



</td><td>

ContentTypeFactory&lt;TCT&gt;

</td><td>



</td></tr>
<tr><td>

[mutable](./IFileSystemAccessTreeParams.mutable.md)

</td><td>



</td><td>

boolean | IFilterSpec

</td><td>

Controls mutability of the file tree.

</td></tr>
</tbody></table>
