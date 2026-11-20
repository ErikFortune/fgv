[Home](../README.md) > IFsFileTreeInitParams

# Interface: IFsFileTreeInitParams

Initialization parameters for FileTree.FsFileTreeAccessors | FsFileTreeAccessors.

**Extends:** [`IFileTreeInitParams<TCT>`](IFileTreeInitParams.md)

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

[absolutePathPolicy](./IFsFileTreeInitParams.absolutePathPolicy.md)

</td><td>



</td><td>

[FsAbsolutePathPolicy](../type-aliases/FsAbsolutePathPolicy.md)

</td><td>

How a path that resolves outside `prefix` is treated, for every operation —
reads, listings, stats and writes alike.

</td></tr>
<tr><td>

[realPath](./IFsFileTreeInitParams.realPath.md)

</td><td>



</td><td>

boolean

</td><td>

When `true`, every operation also checks the real path of what it touches —
symbolic links followed — and refuses one that leads outside the real path
of the prefix.

</td></tr>
<tr><td>

[prefix](./IFileTreeInitParams.prefix.md)

</td><td>



</td><td>

string

</td><td>



</td></tr>
<tr><td>

[inferContentType](./IFileTreeInitParams.inferContentType.md)

</td><td>



</td><td>

[ContentTypeFactory](../type-aliases/ContentTypeFactory.md)&lt;TCT&gt;

</td><td>



</td></tr>
<tr><td>

[mutable](./IFileTreeInitParams.mutable.md)

</td><td>



</td><td>

boolean | [IFilterSpec](IFilterSpec.md)

</td><td>

Controls mutability of the file tree.

</td></tr>
</tbody></table>
