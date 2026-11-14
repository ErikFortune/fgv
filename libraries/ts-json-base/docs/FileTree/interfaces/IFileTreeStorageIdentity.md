[Home](../../README.md) > [FileTree](../README.md) > IFileTreeStorageIdentity

# Interface: IFileTreeStorageIdentity

What storage a FileTree.IFileTreeDirectoryItem | directory item names.

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

[accessors](./IFileTreeStorageIdentity.accessors.md)

</td><td>

`readonly`

</td><td>

[IFileTreeAccessors](../../interfaces/IFileTreeAccessors.md)&lt;TCT&gt;

</td><td>

The accessors object that serves the item.

</td></tr>
<tr><td>

[path](./IFileTreeStorageIdentity.path.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The item's absolute path, as its accessors resolve it.

</td></tr>
<tr><td>

[realPath](./IFileTreeStorageIdentity.realPath.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

For a filesystem-backed item, its canonical path with every symbolic link
resolved.

</td></tr>
</tbody></table>
