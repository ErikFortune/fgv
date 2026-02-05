[Home](../../README.md) > [Runtime](../README.md) > ISaveOptions

# Interface: ISaveOptions

Options for saving an editing session

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

[createJournalRecord](./ISaveOptions.createJournalRecord.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to create a journal record

</td></tr>
<tr><td>

[createNewVersion](./ISaveOptions.createNewVersion.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to create a new recipe version from modifications

</td></tr>
<tr><td>

[versionLabel](./ISaveOptions.versionLabel.md)

</td><td>

`readonly`

</td><td>

[FillingVersionSpec](../../type-aliases/FillingVersionSpec.md)

</td><td>

Version label for the new version (required if createNewVersion is true)

</td></tr>
<tr><td>

[journalNotes](./ISaveOptions.journalNotes.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional notes for the journal record

</td></tr>
</tbody></table>
