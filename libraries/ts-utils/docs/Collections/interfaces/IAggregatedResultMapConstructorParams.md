[Home](../../README.md) > [Collections](../README.md) > IAggregatedResultMapConstructorParams

# Interface: IAggregatedResultMapConstructorParams

Parameters for constructing an AggregatedResultMap | aggregated result map.

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

[compositeIdValidator](./IAggregatedResultMapConstructorParams.compositeIdValidator.md)

</td><td>

`readonly`

</td><td>

[Validator](../../interfaces/Validator.md)&lt;TCOMPOSITEID, unknown&gt;

</td><td>

Validator for composite IDs.

</td></tr>
<tr><td>

[collectionIdConverter](./IAggregatedResultMapConstructorParams.collectionIdConverter.md)

</td><td>

`readonly`

</td><td>

[Converter](../../interfaces/Converter.md)&lt;TCOLLECTIONID, unknown&gt; | [Validator](../../interfaces/Validator.md)&lt;TCOLLECTIONID, unknown&gt;

</td><td>

Converter or validator for collection IDs.

</td></tr>
<tr><td>

[itemIdConverter](./IAggregatedResultMapConstructorParams.itemIdConverter.md)

</td><td>

`readonly`

</td><td>

[Converter](../../interfaces/Converter.md)&lt;TITEMID, unknown&gt; | [Validator](../../interfaces/Validator.md)&lt;TITEMID, unknown&gt;

</td><td>

Converter or validator for item IDs.

</td></tr>
<tr><td>

[itemConverter](./IAggregatedResultMapConstructorParams.itemConverter.md)

</td><td>

`readonly`

</td><td>

[Converter](../../interfaces/Converter.md)&lt;TITEM, unknown&gt; | [Validator](../../interfaces/Validator.md)&lt;TITEM, unknown&gt;

</td><td>

Converter or validator for individual items in each collection.

</td></tr>
<tr><td>

[metadataConverter](./IAggregatedResultMapConstructorParams.metadataConverter.md)

</td><td>

`readonly`

</td><td>

[Converter](../../interfaces/Converter.md)&lt;TMETADATA, unknown&gt; | [Validator](../../interfaces/Validator.md)&lt;TMETADATA, unknown&gt;

</td><td>

Optional converter or validator for collection metadata.

</td></tr>
<tr><td>

[separator](./IAggregatedResultMapConstructorParams.separator.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

Optional separator string for composite IDs.

</td></tr>
<tr><td>

[collections](./IAggregatedResultMapConstructorParams.collections.md)

</td><td>

`readonly`

</td><td>

readonly [AggregatedResultMapEntryInit](../../type-aliases/AggregatedResultMapEntryInit.md)&lt;TCOLLECTIONID, TITEMID, TITEM, TMETADATA&gt;[]

</td><td>

Initial collections to populate the map.

</td></tr>
</tbody></table>
