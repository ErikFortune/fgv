[Home](../README.md) > ICollectionLoaderInitParams

# Interface: ICollectionLoaderInitParams

Parameters used to initialize a LibraryData.CollectionLoader | CollectionLoader.

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

[itemConverter](./ICollectionLoaderInitParams.itemConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt; | Validator&lt;T, unknown&gt;

</td><td>



</td></tr>
<tr><td>

[collectionIdConverter](./ICollectionLoaderInitParams.collectionIdConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TCOLLECTIONID&gt;

</td><td>



</td></tr>
<tr><td>

[itemIdConverter](./ICollectionLoaderInitParams.itemIdConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;TITEMID, unknown&gt; | Validator&lt;TITEMID, unknown&gt;

</td><td>



</td></tr>
<tr><td>

[fileNameConverter](./ICollectionLoaderInitParams.fileNameConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;string, unknown&gt;

</td><td>

Optional converter to transform file names before applying the collection ID converter.

</td></tr>
<tr><td>

[mutable](./ICollectionLoaderInitParams.mutable.md)

</td><td>

`readonly`

</td><td>

[MutabilitySpec](../type-aliases/MutabilitySpec.md)

</td><td>

Default mutability specification for loaded collections.

</td></tr>
<tr><td>

[logger](./ICollectionLoaderInitParams.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown, unknown&gt;

</td><td>

Optional logger for reporting loading progress and issues.

</td></tr>
</tbody></table>
