[Home](../../README.md) > [Entities](../README.md) > IProducedRolledTruffleEntity

# Interface: IProducedRolledTruffleEntity

Produced rolled truffle with concrete choices.
Yield stores count + weightPerPiece + bufferPercentage; targetWeight is derived.

**Extends:** [`IProducedConfectionEntityBase`](../../interfaces/IProducedConfectionEntityBase.md)

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

[confectionType](./IProducedRolledTruffleEntity.confectionType.md)

</td><td>

`readonly`

</td><td>

"rolled-truffle"

</td><td>

Confection type discriminator

</td></tr>
<tr><td>

[yield](./IProducedRolledTruffleEntity.yield.md)

</td><td>

`readonly`

</td><td>

[IBufferedYieldInPieces](../../interfaces/IBufferedYieldInPieces.md)

</td><td>

Count-based yield: count + weightPerPiece + bufferPercentage stored; targetWeight derived

</td></tr>
<tr><td>

[enrobingChocolateId](./IProducedRolledTruffleEntity.enrobingChocolateId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md)

</td><td>

Resolved enrobing chocolate ingredient ID (if used)

</td></tr>
<tr><td>

[coatingId](./IProducedRolledTruffleEntity.coatingId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../../type-aliases/IngredientId.md)

</td><td>

Resolved coating ingredient ID (if used)

</td></tr>
<tr><td>

[variationId](./IProducedConfectionEntityBase.variationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Confection variation ID that was produced

</td></tr>
<tr><td>

[fillings](./IProducedConfectionEntityBase.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [AnyResolvedFillingSlotEntity](../../type-aliases/AnyResolvedFillingSlotEntity.md)[]

</td><td>

Resolved filling slots with concrete selections

</td></tr>
<tr><td>

[procedureId](./IProducedConfectionEntityBase.procedureId.md)

</td><td>

`readonly`

</td><td>

[ProcedureId](../../type-aliases/ProcedureId.md)

</td><td>

Resolved procedure ID if one was used

</td></tr>
<tr><td>

[notes](./IProducedConfectionEntityBase.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about production

</td></tr>
</tbody></table>
