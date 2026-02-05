[Home](../../../README.md) > [Runtime](../../README.md) > [Session](../README.md) > IConfectionSaveOptions

# Interface: IConfectionSaveOptions

Options for saving a confection editing session

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

[createJournalRecord](./IConfectionSaveOptions.createJournalRecord.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to create a journal record

</td></tr>
<tr><td>

[createNewVersion](./IConfectionSaveOptions.createNewVersion.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to create a new confection version from modifications

</td></tr>
<tr><td>

[versionLabel](./IConfectionSaveOptions.versionLabel.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Version label for the new version (required if createNewVersion is true)

</td></tr>
<tr><td>

[journalNotes](./IConfectionSaveOptions.journalNotes.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional notes for the journal record

</td></tr>
<tr><td>

[saveLinkedRecipeSessions](./IConfectionSaveOptions.saveLinkedRecipeSessions.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to save linked recipe sessions (default: true)

</td></tr>
</tbody></table>
