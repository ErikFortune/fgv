[Home](../../README.md) > [UserLibrary](../README.md) > ISaveResult

# Interface: ISaveResult

Result of saving an editing session

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

[journalId](./ISaveResult.journalId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The journal ID if a journal entry was created

</td></tr>
<tr><td>

[journalEntry](./ISaveResult.journalEntry.md)

</td><td>

`readonly`

</td><td>

[IFillingEditJournalEntryEntity](../../interfaces/IFillingEditJournalEntryEntity.md) | [IConfectionEditJournalEntryEntity](../../interfaces/IConfectionEditJournalEntryEntity.md)

</td><td>

The full journal entry if one was created.

</td></tr>
<tr><td>

[newVariationSpec](./ISaveResult.newVariationSpec.md)

</td><td>

`readonly`

</td><td>

[FillingRecipeVariationSpec](../../type-aliases/FillingRecipeVariationSpec.md) | [ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

The new variation spec if one was created

</td></tr>
<tr><td>

[variationEntity](./ISaveResult.variationEntity.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariationEntity](../../interfaces/IFillingRecipeVariationEntity.md)

</td><td>

The new variation entity if one was created (for persistence by caller)

</td></tr>
</tbody></table>
