[Home](../README.md) > IExternalLibraryRefConfig

# Interface: IExternalLibraryRefConfig

Reference to an external library before platform resolution.
The ref is platform-specific and will be resolved to a FileTree.

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

[name](./IExternalLibraryRefConfig.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable name for the library

</td></tr>
<tr><td>

[ref](./IExternalLibraryRefConfig.ref.md)

</td><td>

`readonly`

</td><td>

[ExternalLibraryRef](../type-aliases/ExternalLibraryRef.md)

</td><td>

Platform-specific path or URI (resolved by platform layer)

</td></tr>
<tr><td>

[load](./IExternalLibraryRefConfig.load.md)

</td><td>

`readonly`

</td><td>

boolean | Partial&lt;Record&lt;"default" | [SubLibraryId](../type-aliases/SubLibraryId.md), boolean&gt;&gt;

</td><td>

Which sublibraries to load from this source.

</td></tr>
<tr><td>

[mutable](./IExternalLibraryRefConfig.mutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether collections from this source are mutable

</td></tr>
</tbody></table>
