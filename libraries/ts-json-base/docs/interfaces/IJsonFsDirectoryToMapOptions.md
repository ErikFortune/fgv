[Home](../README.md) > IJsonFsDirectoryToMapOptions

# Interface: IJsonFsDirectoryToMapOptions

Options controlling conversion of a directory to a `Map`.

**Extends:** [`IJsonFsDirectoryOptions<T, TC>`](IJsonFsDirectoryOptions.md)

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

[transformName](./IJsonFsDirectoryToMapOptions.transformName.md)

</td><td>



</td><td>

[ItemNameTransformFunction](../type-aliases/ItemNameTransformFunction.md)&lt;T&gt;

</td><td>



</td></tr>
<tr><td>

[converter](./IJsonFsDirectoryOptions.converter.md)

</td><td>



</td><td>

[Converter](../type-aliases/Converter.md)&lt;T, TC&gt; | [Validator](../type-aliases/Validator.md)&lt;T, TC&gt;

</td><td>

The converter used to convert incoming JSON objects.

</td></tr>
<tr><td>

[files](./IJsonFsDirectoryOptions.files.md)

</td><td>



</td><td>

RegExp[]

</td><td>

Filter applied to items in the directory

</td></tr>
</tbody></table>
