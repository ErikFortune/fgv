[Home](../../README.md) > [Resources](../README.md) > ICandidateValue

# Interface: ICandidateValue

Interface for a candidate value that can be collected and indexed.
Candidate values are normalized JSON values that can be shared across
multiple resource candidates to reduce duplication.

**Extends:** `ICollectible<CandidateValueKey, CandidateValueIndex>`

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

[key](./ICandidateValue.key.md)

</td><td>

`readonly`

</td><td>

[CandidateValueKey](../../type-aliases/CandidateValueKey.md)

</td><td>

The unique key for this candidate value, derived from the hash of the normalized JSON.

</td></tr>
<tr><td>

[index](./ICandidateValue.index.md)

</td><td>

`readonly`

</td><td>

[CandidateValueIndex](../../type-aliases/CandidateValueIndex.md) | undefined

</td><td>

The index of this candidate value in the collection.

</td></tr>
<tr><td>

[json](./ICandidateValue.json.md)

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

[setIndex(index)](./ICandidateValue.setIndex.md)

</td><td>



</td><td>

Sets the index of this candidate value.

</td></tr>
</tbody></table>
