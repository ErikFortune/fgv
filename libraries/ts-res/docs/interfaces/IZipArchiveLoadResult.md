[Home](../README.md) > IZipArchiveLoadResult

# Interface: IZipArchiveLoadResult

Result of ZIP archive loading

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

[manifest](./IZipArchiveLoadResult.manifest.md)

</td><td>



</td><td>

[IZipArchiveManifest](../type-aliases/IZipArchiveManifest.md) | undefined

</td><td>

Parsed archive manifest

</td></tr>
<tr><td>

[config](./IZipArchiveLoadResult.config.md)

</td><td>



</td><td>

[ISystemConfiguration](ISystemConfiguration.md) | undefined

</td><td>

Loaded configuration

</td></tr>
<tr><td>

[files](./IZipArchiveLoadResult.files.md)

</td><td>



</td><td>

[IImportedFile](../type-aliases/IImportedFile.md)[]

</td><td>

All files extracted from the archive

</td></tr>
<tr><td>

[directory](./IZipArchiveLoadResult.directory.md)

</td><td>



</td><td>

[IImportedDirectory](../type-aliases/IImportedDirectory.md) | undefined

</td><td>

Directory structure if available

</td></tr>
</tbody></table>
