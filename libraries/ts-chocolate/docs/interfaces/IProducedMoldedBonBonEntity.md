[Home](../README.md) > IProducedMoldedBonBonEntity

# Interface: IProducedMoldedBonBonEntity

Produced molded bonbon with concrete choices.
Yield stores only numFrames + bufferPercentage; count/weightPerPiece/targetWeight are derived.

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

[confectionType](./IProducedMoldedBonBonEntity.confectionType.md)

</td><td>

`readonly`

</td><td>

"molded-bonbon"

</td><td>

Confection type discriminator

</td></tr>
<tr><td>

[yield](./IProducedMoldedBonBonEntity.yield.md)

</td><td>

`readonly`

</td><td>

[IBufferedYieldInFrames](IBufferedYieldInFrames.md)

</td><td>

Frame-based yield: numFrames + bufferPercentage stored; rest derived from mold

</td></tr>
<tr><td>

[moldId](./IProducedMoldedBonBonEntity.moldId.md)

</td><td>

`readonly`

</td><td>

[MoldId](../type-aliases/MoldId.md)

</td><td>

Resolved mold ID

</td></tr>
<tr><td>

[shellChocolateId](./IProducedMoldedBonBonEntity.shellChocolateId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../type-aliases/IngredientId.md)

</td><td>

Resolved shell chocolate ingredient ID

</td></tr>
<tr><td>

[sealChocolateId](./IProducedMoldedBonBonEntity.sealChocolateId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../type-aliases/IngredientId.md)

</td><td>

Resolved seal chocolate ingredient ID (if used)

</td></tr>
<tr><td>

[decorationChocolateId](./IProducedMoldedBonBonEntity.decorationChocolateId.md)

</td><td>

`readonly`

</td><td>

[IngredientId](../type-aliases/IngredientId.md)

</td><td>

Resolved decoration chocolate ingredient ID (if used)

</td></tr>
<tr><td>

[variationId](./IProducedConfectionEntityBase.variationId.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationId](../type-aliases/ConfectionRecipeVariationId.md)

</td><td>

Confection variation ID that was produced

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

[decorationId](./IProducedConfectionEntityBase.decorationId.md)

</td><td>

`readonly`

</td><td>

[DecorationId](../type-aliases/DecorationId.md)

</td><td>

Resolved decoration ID if one was selected

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
