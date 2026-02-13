[Home](../README.md) > IGroupNotesJournalEntryEntity

# Interface: IGroupNotesJournalEntryEntity

Journal entry for session group metadata and notes.
Used to record notes about a group of related sessions.

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

[type](./IGroupNotesJournalEntryEntity.type.md)

</td><td>

`readonly`

</td><td>

"group-notes"

</td><td>

Entry type discriminator

</td></tr>
<tr><td>

[baseId](./IGroupNotesJournalEntryEntity.baseId.md)

</td><td>

`readonly`

</td><td>

[BaseJournalId](../type-aliases/BaseJournalId.md)

</td><td>

Base identifier within collection (no collection prefix)

</td></tr>
<tr><td>

[timestamp](./IGroupNotesJournalEntryEntity.timestamp.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Timestamp when this entry was created (ISO 8601 format)

</td></tr>
<tr><td>

[group](./IGroupNotesJournalEntryEntity.group.md)

</td><td>

`readonly`

</td><td>

[GroupName](../type-aliases/GroupName.md)

</td><td>

Group identifier (matches session group field)

</td></tr>
<tr><td>

[label](./IGroupNotesJournalEntryEntity.label.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional label for the group

</td></tr>
<tr><td>

[notes](./IGroupNotesJournalEntryEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this group

</td></tr>
</tbody></table>
