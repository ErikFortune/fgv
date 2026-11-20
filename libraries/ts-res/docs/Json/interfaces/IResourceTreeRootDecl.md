[Home](../../README.md) > [Json](../README.md) > IResourceTreeRootDecl

# Interface: IResourceTreeRootDecl

Normalized non-validated declaration of a Resources.Resource | resource tree root.

**Extends:** [`IResourceTreeChildNodeDecl<TQualifierNames>`](../../interfaces/IResourceTreeChildNodeDecl.md)

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

[context](./IResourceTreeRootDecl.context.md)

</td><td>

`readonly`

</td><td>

[IContainerContextDecl](../../interfaces/IContainerContextDecl.md)&lt;TQualifierNames&gt;

</td><td>



</td></tr>
<tr><td>

[resources](./IResourceTreeRootDecl.resources.md)

</td><td>

`readonly`

</td><td>

Record&lt;string, [IChildResourceDecl](../../interfaces/IChildResourceDecl.md)&lt;TQualifierNames&gt;&gt;

</td><td>



</td></tr>
<tr><td>

[children](./IResourceTreeRootDecl.children.md)

</td><td>

`readonly`

</td><td>

Record&lt;string, [IResourceTreeChildNodeDecl](../../interfaces/IResourceTreeChildNodeDecl.md)&lt;TQualifierNames&gt;&gt;

</td><td>



</td></tr>
<tr><td>

[metadata](./IResourceTreeRootDecl.metadata.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>



</td></tr>
</tbody></table>
