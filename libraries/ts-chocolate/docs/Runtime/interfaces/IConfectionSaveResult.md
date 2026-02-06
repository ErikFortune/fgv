[Home](../../README.md) > [Runtime](../README.md) > IConfectionSaveResult

# Interface: IConfectionSaveResult

Result of saving a confection editing session

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

[journalId](./IConfectionSaveResult.journalId.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The journal ID if a journal entry was created

</td></tr>
<tr><td>

[journalEntry](./IConfectionSaveResult.journalEntry.md)

</td><td>

`readonly`

</td><td>

[IConfectionEditJournalEntryEntity](../../interfaces/IConfectionEditJournalEntryEntity.md)

</td><td>

The full journal entry if one was created

</td></tr>
<tr><td>

[newVariationSpec](./IConfectionSaveResult.newVariationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

The new variation spec if one was created

</td></tr>
<tr><td>

[linkedRecipeJournalIds](./IConfectionSaveResult.linkedRecipeJournalIds.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Journal IDs of linked recipe sessions that were saved

</td></tr>
</tbody></table>
