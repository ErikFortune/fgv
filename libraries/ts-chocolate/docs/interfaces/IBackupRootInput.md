[Home](../README.md) > IBackupRootInput

# Interface: IBackupRootInput

Input to backupRoots: a single storage root to include in the backup.

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

[id](./IBackupRootInput.id.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The storage root ID — used as the subdirectory name inside the ZIP.

</td></tr>
<tr><td>

[label](./IBackupRootInput.label.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Human-readable label stored in the manifest.

</td></tr>
<tr><td>

[dir](./IBackupRootInput.dir.md)

</td><td>

`readonly`

</td><td>

IFileTreeDirectoryItem

</td><td>

Root directory of the storage tree to back up.

</td></tr>
</tbody></table>
