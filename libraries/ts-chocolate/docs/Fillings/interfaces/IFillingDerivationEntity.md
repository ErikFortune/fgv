[Home](../../README.md) > [Fillings](../README.md) > IFillingDerivationEntity

# Interface: IFillingDerivationEntity

Reference to a source filling recipe+version from which a filling recipe was derived.
Used to track lineage when a user edits a read-only filling recipe and creates
a new filling recipe in a writable collection.

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

[sourceVersionId](./IFillingDerivationEntity.sourceVersionId.md)

</td><td>

`readonly`

</td><td>

[FillingVersionId](../../type-aliases/FillingVersionId.md)

</td><td>

Source filling recipe version ID (format: "sourceId.fillingId@versionSpec")

</td></tr>
<tr><td>

[derivedDate](./IFillingDerivationEntity.derivedDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date of derivation (ISO 8601 format)

</td></tr>
<tr><td>

[notes](./IFillingDerivationEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about the derivation

</td></tr>
</tbody></table>
