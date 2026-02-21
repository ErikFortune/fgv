[Home](../README.md) > ILocalDirectoryRef

# Interface: ILocalDirectoryRef

Reference to a local directory added by the user via the File System Access API.
The handle is persisted in IndexedDB; this record is stored in device settings
to track which directories should be re-opened on startup.

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

[label](./ILocalDirectoryRef.label.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Display name (matches the FileSystemDirectoryHandle.name)

</td></tr>
<tr><td>

[mutable](./ILocalDirectoryRef.mutable.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the directory was opened with write access

</td></tr>
<tr><td>

[load](./ILocalDirectoryRef.load.md)

</td><td>

`readonly`

</td><td>

boolean | Partial&lt;Record&lt;"default" | [SubLibraryId](../type-aliases/SubLibraryId.md), boolean&gt;&gt;

</td><td>

Which sublibraries to load from this directory.

</td></tr>
</tbody></table>
