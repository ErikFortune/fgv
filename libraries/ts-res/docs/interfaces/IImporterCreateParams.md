[Home](../README.md) > IImporterCreateParams

# Interface: IImporterCreateParams

Parameters for creating an Import.ImportManager | ImportManager.

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

[resources](./IImporterCreateParams.resources.md)

</td><td>



</td><td>

[ResourceManagerBuilder](../classes/ResourceManagerBuilder.md)

</td><td>

The Resources.ResourceManagerBuilder | resource manager builder into which resources

</td></tr>
<tr><td>

[initialContext](./IImporterCreateParams.initialContext.md)

</td><td>



</td><td>

[ImportContext](../classes/ImportContext.md)

</td><td>

An optional initial Import.ImportContext | import context for the import operation.

</td></tr>
<tr><td>

[fileTree](./IImporterCreateParams.fileTree.md)

</td><td>



</td><td>

FileTree_2&lt;string&gt;

</td><td>

An optional `FileTree` for importing path items.

</td></tr>
<tr><td>

[importers](./IImporterCreateParams.importers.md)

</td><td>



</td><td>

[IImporter](IImporter.md)[]

</td><td>

An optional list of Import.Importers.IImporter | importers to use for the import.

</td></tr>
<tr><td>

[fileContentConverter](./IImporterCreateParams.fileContentConverter.md)

</td><td>



</td><td>

Converter&lt;JsonValue, unknown&gt;

</td><td>

An optional converter used to pre-process file contents before JSON import validation.

</td></tr>
<tr><td>

[fileContentExtensions](./IImporterCreateParams.fileContentExtensions.md)

</td><td>



</td><td>

readonly string[]

</td><td>

Optional file extensions which should be parsed using the supplied file content converter.

</td></tr>
</tbody></table>
