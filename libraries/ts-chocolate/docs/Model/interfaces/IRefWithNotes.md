[Home](../../README.md) > [Model](../README.md) > IRefWithNotes

# Interface: IRefWithNotes

Generic reference type with an ID and optional categorized notes.
Use as base for mold refs, procedure refs, etc.
Satisfies IHasId for use with IOptionsWithPreferred.

**Extends:** [`IHasId<TId>`](../../interfaces/IHasId.md)

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

[id](./IRefWithNotes.id.md)

</td><td>

`readonly`

</td><td>

TId

</td><td>

The referenced entity's ID

</td></tr>
<tr><td>

[notes](./IRefWithNotes.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes specific to this reference

</td></tr>
</tbody></table>
