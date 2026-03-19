[Home](../README.md) > IBackupManifest

# Interface: IBackupManifest

Metadata written to `_backup-manifest.json` at the root of a backup ZIP.

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

[version](./IBackupManifest.version.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Backup format version.

</td></tr>
<tr><td>

[createdAt](./IBackupManifest.createdAt.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

ISO 8601 creation timestamp.

</td></tr>
<tr><td>

[roots](./IBackupManifest.roots.md)

</td><td>

`readonly`

</td><td>

readonly [IBackupRootEntry](IBackupRootEntry.md)[]

</td><td>

One entry per backed-up root.

</td></tr>
</tbody></table>
