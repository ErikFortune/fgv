[Home](../README.md) > ZipArchive

# Namespace: ZipArchive

ZIP archive functionality for ts-res source file archives

This packlet provides consolidated ZIP archive creation and loading functionality
for source files, compatible with existing tools while using fflate for
universal browser compatibility.

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Json](./Json/README.md)

</td><td>



</td></tr>
<tr><td>

[Convert](./Convert/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ZipArchiveCreator](./classes/ZipArchiveCreator.md)

</td><td>

ZIP archive creator using fflate for universal compatibility

</td></tr>
<tr><td>

[ZipArchiveLoader](./classes/ZipArchiveLoader.md)

</td><td>

ZIP archive loader extending ts-extras foundation

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IZipArchivePathOptions](./interfaces/IZipArchivePathOptions.md)

</td><td>

Options for creating a ZIP archive buffer

</td></tr>
<tr><td>

[IZipArchiveFileTreeOptions](./interfaces/IZipArchiveFileTreeOptions.md)

</td><td>

Options for creating a ZIP archive buffer from a file tree

</td></tr>
<tr><td>

[IZipArchiveResult](./interfaces/IZipArchiveResult.md)

</td><td>

Result of ZIP archive buffer creation

</td></tr>
<tr><td>

[IZipArchiveLoadOptions](./interfaces/IZipArchiveLoadOptions.md)

</td><td>

Options for loading a ZIP archive

</td></tr>
<tr><td>

[IZipArchiveLoadResult](./interfaces/IZipArchiveLoadResult.md)

</td><td>

Result of ZIP archive loading

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ZipArchiveOptions](./type-aliases/ZipArchiveOptions.md)

</td><td>

Options for creating a ZIP archive buffer

</td></tr>
<tr><td>

[IZipArchiveManifest](./type-aliases/IZipArchiveManifest.md)

</td><td>

Standardized ZIP archive manifest format (compatible with existing tools)

</td></tr>
<tr><td>

[IImportedFile](./type-aliases/IImportedFile.md)

</td><td>

Imported file representation

</td></tr>
<tr><td>

[IImportedDirectory](./type-aliases/IImportedDirectory.md)

</td><td>

Imported directory structure

</td></tr>
<tr><td>

[ZipArchiveProgressCallback](./type-aliases/ZipArchiveProgressCallback.md)

</td><td>

Progress callback for ZIP operations

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createZipArchiveManifest](./functions/createZipArchiveManifest.md)

</td><td>

Create a ZIP archive manifest object

</td></tr>
<tr><td>

[parseZipArchiveManifest](./functions/parseZipArchiveManifest.md)

</td><td>

Parse and validate a ZIP archive manifest

</td></tr>
<tr><td>

[validateZipArchiveManifest](./functions/validateZipArchiveManifest.md)

</td><td>

Validate a ZIP archive manifest object

</td></tr>
<tr><td>

[parseZipArchiveConfiguration](./functions/parseZipArchiveConfiguration.md)

</td><td>

Parse and validate configuration JSON

</td></tr>
<tr><td>

[generateZipArchiveFilename](./functions/generateZipArchiveFilename.md)

</td><td>

Generate a timestamp-based filename for ZIP archives

</td></tr>
<tr><td>

[normalizePath](./functions/normalizePath.md)

</td><td>

Normalize path separators for cross-platform compatibility

</td></tr>
<tr><td>

[getDirectoryName](./functions/getDirectoryName.md)

</td><td>

Extract directory name from a file path

</td></tr>
<tr><td>

[sanitizeFilename](./functions/sanitizeFilename.md)

</td><td>

Create a safe filename by removing invalid characters

</td></tr>
<tr><td>

[isZipFile](./functions/isZipFile.md)

</td><td>

Validate ZIP file extension

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ZipArchiveConstants](./variables/ZipArchiveConstants.md)

</td><td>

Constants for ZIP archive structure

</td></tr>
</tbody></table>
