[Home](../../README.md) > [FileTree](../README.md) > IMutableBinaryFileTreeFileItem

# Interface: IMutableBinaryFileTreeFileItem

Extended file item interface for files whose contents can be both read and written
as raw bytes.

**Extends:** [`IBinaryFileTreeFileItem<TCT>`](../../interfaces/IBinaryFileTreeFileItem.md), [`IMutableFileTreeFileItem<TCT>`](../../interfaces/IMutableFileTreeFileItem.md)

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

[type](./IBinaryFileTreeFileItem.type.md)

</td><td>

`readonly`

</td><td>

"file"

</td><td>

Indicates that this FileTree.FileTreeItem | file tree item is a file.

</td></tr>
<tr><td>

[absolutePath](./IBinaryFileTreeFileItem.absolutePath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The absolute path of the file.

</td></tr>
<tr><td>

[name](./IBinaryFileTreeFileItem.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the file

</td></tr>
<tr><td>

[baseName](./IBinaryFileTreeFileItem.baseName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The base name of the file (without extension)

</td></tr>
<tr><td>

[extension](./IBinaryFileTreeFileItem.extension.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The extension of the file

</td></tr>
<tr><td>

[contentType](./IBinaryFileTreeFileItem.contentType.md)

</td><td>

`readonly`

</td><td>

TCT | undefined

</td><td>

An optional content type (e.g.

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

[setRawBytes(bytes)](./IMutableBinaryFileTreeFileItem.setRawBytes.md)

</td><td>



</td><td>

Sets the raw contents of the file from bytes, with no text encoding applied.

</td></tr>
<tr><td>

[getRawBytes()](./IBinaryFileTreeFileItem.getRawBytes.md)

</td><td>



</td><td>

Gets the raw contents of the file as bytes, with no text decoding applied.

</td></tr>
<tr><td>

[getContents()](./IBinaryFileTreeFileItem.getContents.md)

</td><td>



</td><td>

Gets the contents of the file as parsed JSON.

</td></tr>
<tr><td>

[getRawContents()](./IBinaryFileTreeFileItem.getRawContents.md)

</td><td>



</td><td>

Gets the raw contents of the file as a string.

</td></tr>
<tr><td>

[getIsMutable()](./IMutableFileTreeFileItem.getIsMutable.md)

</td><td>



</td><td>

Indicates whether this file can be saved.

</td></tr>
<tr><td>

[setContents(json)](./IMutableFileTreeFileItem.setContents.md)

</td><td>



</td><td>

Sets the contents of the file from a JSON value.

</td></tr>
<tr><td>

[setRawContents(contents)](./IMutableFileTreeFileItem.setRawContents.md)

</td><td>



</td><td>

Sets the raw contents of the file.

</td></tr>
<tr><td>

[delete()](./IMutableFileTreeFileItem.delete.md)

</td><td>



</td><td>

Deletes this file from its backing store.

</td></tr>
</tbody></table>
