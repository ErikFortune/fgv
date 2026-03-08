[Home](../../README.md) > [Journal](../README.md) > IMoldedBonBonJournalVariation

# Interface: IMoldedBonBonJournalVariation

Molded bonbon variation snapshot for journal entries.
Extends the entity interface with a `variationType` discriminator.

**Extends:** [`IMoldedBonBonRecipeVariationEntity`](../../interfaces/IMoldedBonBonRecipeVariationEntity.md)

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

[variationType](./IMoldedBonBonJournalVariation.variationType.md)

</td><td>

`readonly`

</td><td>

"molded-bonbon"

</td><td>



</td></tr>
<tr><td>

[yield](./IMoldedBonBonRecipeVariationEntity.yield.md)

</td><td>

`readonly`

</td><td>

[IYieldInFrames](../../interfaces/IYieldInFrames.md)

</td><td>

Template yield: number of frames to produce

</td></tr>
<tr><td>

[molds](./IMoldedBonBonRecipeVariationEntity.molds.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IConfectionMoldRef](../../type-aliases/IConfectionMoldRef.md), [MoldId](../../type-aliases/MoldId.md)&gt;

</td><td>

Required molds with preferred selection

</td></tr>
<tr><td>

[shellChocolate](./IMoldedBonBonRecipeVariationEntity.shellChocolate.md)

</td><td>

`readonly`

</td><td>

[IChocolateSpec](../../type-aliases/IChocolateSpec.md)

</td><td>

Required shell chocolate specification

</td></tr>
<tr><td>

[additionalChocolates](./IMoldedBonBonRecipeVariationEntity.additionalChocolates.md)

</td><td>

`readonly`

</td><td>

readonly [IAdditionalChocolateEntity](../../interfaces/IAdditionalChocolateEntity.md)[]

</td><td>

Optional additional chocolates (seal, decoration)

</td></tr>
<tr><td>

[variationSpec](./IMoldedBonBonRecipeVariationEntity.variationSpec.md)

</td><td>

`readonly`

</td><td>

[ConfectionRecipeVariationSpec](../../type-aliases/ConfectionRecipeVariationSpec.md)

</td><td>

Unique identifier for this variation

</td></tr>
<tr><td>

[name](./IMoldedBonBonRecipeVariationEntity.name.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional human-readable name for this variation

</td></tr>
<tr><td>

[createdDate](./IMoldedBonBonRecipeVariationEntity.createdDate.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Date this variation was created (ISO 8601 format)

</td></tr>
<tr><td>

[fillings](./IMoldedBonBonRecipeVariationEntity.fillings.md)

</td><td>

`readonly`

</td><td>

readonly [IFillingSlotEntity](../../interfaces/IFillingSlotEntity.md)[]

</td><td>

Optional filling slots - each slot has independent options with a preferred selection

</td></tr>
<tr><td>

[decorations](./IMoldedBonBonRecipeVariationEntity.decorations.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IDecorationRefEntity](../../interfaces/IDecorationRefEntity.md), [DecorationId](../../type-aliases/DecorationId.md)&gt;

</td><td>

Optional decoration references with preferred selection

</td></tr>
<tr><td>

[procedures](./IMoldedBonBonRecipeVariationEntity.procedures.md)

</td><td>

`readonly`

</td><td>

[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IProcedureRefEntity](../../type-aliases/IProcedureRefEntity.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt;

</td><td>

Optional procedures with preferred selection

</td></tr>
<tr><td>

[notes](./IMoldedBonBonRecipeVariationEntity.notes.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedNote](../../interfaces/ICategorizedNote.md)[]

</td><td>

Optional categorized notes about this variation

</td></tr>
<tr><td>

[additionalTags](./IMoldedBonBonRecipeVariationEntity.additionalTags.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

Additional tags (merged with base confection tags)

</td></tr>
<tr><td>

[additionalUrls](./IMoldedBonBonRecipeVariationEntity.additionalUrls.md)

</td><td>

`readonly`

</td><td>

readonly [ICategorizedUrl](../../interfaces/ICategorizedUrl.md)[]

</td><td>

Additional URLs (merged with base confection URLs)

</td></tr>
</tbody></table>
