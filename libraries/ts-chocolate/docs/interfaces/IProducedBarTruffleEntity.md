[Home](../README.md) > IProducedBarTruffleEntity

# Interface: IProducedBarTruffleEntity

Produced bar truffle with concrete choices.

**Extends:** [`IProducedConfectionEntityBase`](IProducedConfectionEntityBase.md)

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

[confectionType](./IProducedBarTruffleEntity.confectionType.md)

</td><td>

`readonly`

</td><td>

"bar-truffle"

</td><td>

Confection type discriminator

</td></tr>
<tr><td>

[enrobingChocolateId](./IProducedBarTruffleEntity.enrobingChocolateId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../type-aliases/IngredientId.md)

</td><td>

Resolved enrobing chocolate ingredient ID (if used)

</td></tr>
<tr><td>

[versionId](./IProducedConfectionEntityBase.versionId.md)

</td><td>

`readonly`

</td><td>

[ConfectionVersionId](../type-aliases/ConfectionVersionId.md)

</td><td>

Confection version ID that was produced

</td></tr>
<tr><td>

[yield](./IProducedConfectionEntityBase.yield.md)

</td><td>

`readonly`

</td><td>

[IConfectionYield](IConfectionYield.md)

</td><td>

Yield specification for this production

</td></tr>
<tr><td>

[fillings](./IProducedConfectionEntityBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [AnyResolvedFillingSlotEntity](../type-aliases/AnyResolvedFillingSlotEntity.md)[]

</td><td>

Resolved filling slots with concrete selections

</td></tr>
<tr><td>

[procedureId](./IProducedConfectionEntityBase.procedureId.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../type-aliases/ProcedureId.md)

</td><td>

Resolved procedure ID if one was used

</td></tr>
<tr><td>

[notes](./IProducedConfectionEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](ICategorizedNote.md)[]

</td><td>

Optional categorized notes about production

</td></tr>
</tbody></table>
