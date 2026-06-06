[Home](../README.md) > ZipFileTree

# Namespace: ZipFileTree

ZIP-based FileTree implementation for ts-extras.

This packlet provides a FileTree accessor implementation that can read from ZIP archives,
making it useful for browser environments where files need to be bundled and transferred
as a single archive.

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ZipFileTreeAccessors](./classes/ZipFileTreeAccessors.md)

</td><td>

Read-only file tree accessors for ZIP archives.

</td></tr>
<tr><td>

[ZipFileItem](./classes/ZipFileItem.md)

</td><td>

Implementation of `FileTree.IFileTreeFileItem` for files in a ZIP archive.

</td></tr>
<tr><td>

[ZipDirectoryItem](./classes/ZipDirectoryItem.md)

</td><td>

Implementation of `IFileTreeDirectoryItem` for directories in a ZIP archive.

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

[IZipTextFile](./interfaces/IZipTextFile.md)

</td><td>

Simple interface for a file to be added to a zip file.

</td></tr>
<tr><td>

[ICreateZipOptions](./interfaces/ICreateZipOptions.md)

</td><td>

Options for creating a zip file from text files.

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

[ZipCompressionLevel](./type-aliases/ZipCompressionLevel.md)

</td><td>

Supported compression levels for zip files.

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

[createZipFromTextFiles](./functions/createZipFromTextFiles.md)

</td><td>

Creates a zip file from an array of text files.

</td></tr>
</tbody></table>
