[Home](../README.md) > IProducedBarTruffleEntity

# Interface: IProducedBarTruffleEntity

Produced bar truffle with concrete choices.
Yield stores count + weightPerPiece + bufferPercentage; targetWeight is derived.
Frame dimensions are derived at runtime from count + bonBonDimensions.

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

[yield](./IProducedBarTruffleEntity.yield.md)

</td><td>

`readonly`

</td><td>

[IBufferedBarTruffleYield](IBufferedBarTruffleYield.md)

</td><td>

Yield with piece dimensions; targetWeight and frameDimensions derived at runtime

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
