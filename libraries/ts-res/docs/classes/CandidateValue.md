[Home](../README.md) > CandidateValue

# Class: CandidateValue

Implementation of a candidate value that stores normalized JSON data.
The value is normalized on creation and a hash-based key is generated
for efficient deduplication.

**Implements:** [`ICandidateValue`](../interfaces/ICandidateValue.md)

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

[key](./CandidateValue.key.md)

</td><td>

`readonly`

</td><td>

[CandidateValueKey](../type-aliases/CandidateValueKey.md)

</td><td>

The unique key for this candidate value.

</td></tr>
<tr><td>

[index](./CandidateValue.index.md)

</td><td>

`readonly`

</td><td>

[CandidateValueIndex](../type-aliases/CandidateValueIndex.md) | undefined

</td><td>

The index of this candidate value in the collection.

</td></tr>
<tr><td>

[json](./CandidateValue.json.md)

</td><td>

`readonly`

</td><td>

JsonValue

</td><td>

The normalized JSON value.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(params)](./CandidateValue.create.md)

</td><td>

`static`

</td><td>

Creates a new Resources.CandidateValue object.

</td></tr>
<tr><td>

[setIndex(index)](./CandidateValue.setIndex.md)

</td><td>



</td><td>

Sets the index of this candidate value.

</td></tr>
</tbody></table>
