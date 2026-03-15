[Home](../README.md) > IConfectionSaveOptions

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

[createNewVariation](./IConfectionSaveOptions.createNewVariation.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to create a new confection variation from modifications

</td></tr>
<tr><td>

[variationLabel](./IConfectionSaveOptions.variationLabel.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Variation label for the new variation (required if createNewVariation is true)

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
