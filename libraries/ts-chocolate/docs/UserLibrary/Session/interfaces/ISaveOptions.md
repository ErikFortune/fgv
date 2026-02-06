[Home](../../../README.md) > [UserLibrary](../../README.md) > [Session](../README.md) > ISaveOptions

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

[createNewVariation](./ISaveOptions.createNewVariation.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether to create a new recipe variation from modifications

</td></tr>
<tr><td>

[variationLabel](./ISaveOptions.variationLabel.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../../../type-aliases/FillingRecipeVariationSpec.md)

</td><td>

Variation label for the new variation (required if createNewVariation is true)

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
