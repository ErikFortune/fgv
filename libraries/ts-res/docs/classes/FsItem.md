[Home](../README.md) > FsItem

# Class: FsItem

Class describing some file system item to be imported.

**Implements:** [`IFsItemProps`](../interfaces/IFsItemProps.md)

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

[baseName](./FsItem.baseName.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The base name of the file system item, once

</td></tr>
<tr><td>

[conditions](./FsItem.conditions.md)

</td><td>

`readonly`

</td><td>

[IValidatedConditionDecl](../interfaces/IValidatedConditionDecl.md)[]

</td><td>

Conditions.IValidatedConditionDecl | Conditions extracted

</td></tr>
<tr><td>

[item](./FsItem.item.md)

</td><td>

`readonly`

</td><td>

FileTreeItem

</td><td>

The underlying `FileTreeItem` for this item.

</td></tr>
<tr><td>

[qualifiers](./FsItem.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The Qualifiers.IReadOnlyQualifierCollector | qualifiers to use for this item.

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

[createForItem(item, qualifiers)](./FsItem.createForItem.md)

</td><td>

`static`

</td><td>

Creates a new Import.FsItem | FsItem from a `FileTreeItem`.

</td></tr>
<tr><td>

[createForPath(importPath, qualifiers, tree)](./FsItem.createForPath.md)

</td><td>

`static`

</td><td>

Creates a new Import.FsItem | FsItem from a file system path.

</td></tr>
<tr><td>

[tryParseBaseName(baseName, qualifiers)](./FsItem.tryParseBaseName.md)

</td><td>

`static`

</td><td>

Tries to parse a base name into a base name and a set of conditions.

</td></tr>
<tr><td>

[getContext()](./FsItem.getContext.md)

</td><td>



</td><td>

Gets the context for this file system item.

</td></tr>
</tbody></table>
