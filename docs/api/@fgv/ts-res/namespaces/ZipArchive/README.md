[**@fgv Monorepo API Documentation**](../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../README.md) / [@fgv/ts-res](../../README.md) / ZipArchive

# ZipArchive

ZIP archive functionality for ts-res source file archives

This packlet provides consolidated ZIP archive creation and loading functionality
for source files, compatible with existing tools while using fflate for
universal browser compatibility.

## Remarks

ZIP archives contain source files for resource ingestion with directory
structure preserved and optional validation but no processing or transformation.
This is distinct from ZIP bundles which contain processed resource output.

## Namespaces

- [Convert](namespaces/Convert/README.md)
- [Json](namespaces/Json/README.md)

## Classes

- [ZipArchiveCreator](classes/ZipArchiveCreator.md)
- [ZipArchiveLoader](classes/ZipArchiveLoader.md)

## Interfaces

- [IZipArchiveFileTreeOptions](interfaces/IZipArchiveFileTreeOptions.md)
- [IZipArchiveLoadOptions](interfaces/IZipArchiveLoadOptions.md)
- [IZipArchiveLoadResult](interfaces/IZipArchiveLoadResult.md)
- [IZipArchivePathOptions](interfaces/IZipArchivePathOptions.md)
- [IZipArchiveResult](interfaces/IZipArchiveResult.md)

## Type Aliases

- [IImportedDirectory](type-aliases/IImportedDirectory.md)
- [IImportedFile](type-aliases/IImportedFile.md)
- [IZipArchiveManifest](type-aliases/IZipArchiveManifest.md)
- [ZipArchiveOptions](type-aliases/ZipArchiveOptions.md)
- [ZipArchiveProgressCallback](type-aliases/ZipArchiveProgressCallback.md)

## Variables

- [ZipArchiveConstants](variables/ZipArchiveConstants.md)

## Functions

- [createZipArchiveManifest](functions/createZipArchiveManifest.md)
- [generateZipArchiveFilename](functions/generateZipArchiveFilename.md)
- [getDirectoryName](functions/getDirectoryName.md)
- [isZipFile](functions/isZipFile.md)
- [normalizePath](functions/normalizePath.md)
- [parseZipArchiveConfiguration](functions/parseZipArchiveConfiguration.md)
- [parseZipArchiveManifest](functions/parseZipArchiveManifest.md)
- [sanitizeFilename](functions/sanitizeFilename.md)
- [validateZipArchiveManifest](functions/validateZipArchiveManifest.md)
