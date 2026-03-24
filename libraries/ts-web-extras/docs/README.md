**@fgv/ts-web-extras**

***

# @fgv/ts-web-extras

Browser-compatible utilities and FileTree implementations.

This library provides browser-compatible alternatives to Node.js-specific functionality,
including Web Crypto API-based hashing, File API-based file tree implementations,
and URL parameter parsing utilities.
All exports are designed to be tree-shakeable for optimal bundle size.

## Namespaces

- [CryptoUtils](@fgv/namespaces/CryptoUtils/README.md)
- [FileTreeHelpers](@fgv/namespaces/FileTreeHelpers/README.md)

## Classes

- [DirectoryHandleStore](classes/DirectoryHandleStore.md)
- [FileApiTreeAccessors](classes/FileApiTreeAccessors.md)
- [FileSystemAccessTreeAccessors](classes/FileSystemAccessTreeAccessors.md)
- [HttpTreeAccessors](classes/HttpTreeAccessors.md)
- [LocalStorageTreeAccessors](classes/LocalStorageTreeAccessors.md)

## Interfaces

- [FilePickerAcceptType](interfaces/FilePickerAcceptType.md)
- [FileSystemCreateWritableOptions](interfaces/FileSystemCreateWritableOptions.md)
- [FileSystemDirectoryHandle](interfaces/FileSystemDirectoryHandle.md)
- [FileSystemFileHandle](interfaces/FileSystemFileHandle.md)
- [FileSystemGetDirectoryOptions](interfaces/FileSystemGetDirectoryOptions.md)
- [FileSystemGetFileOptions](interfaces/FileSystemGetFileOptions.md)
- [FileSystemHandle](interfaces/FileSystemHandle.md)
- [FileSystemHandlePermissionDescriptor](interfaces/FileSystemHandlePermissionDescriptor.md)
- [FileSystemRemoveOptions](interfaces/FileSystemRemoveOptions.md)
- [FileSystemWritableFileStream](interfaces/FileSystemWritableFileStream.md)
- [IDirectoryHandleTreeInitializer](interfaces/IDirectoryHandleTreeInitializer.md)
- [IFileHandleTreeInitializer](interfaces/IFileHandleTreeInitializer.md)
- [IFileListTreeInitializer](interfaces/IFileListTreeInitializer.md)
- [IFileMetadata](interfaces/IFileMetadata.md)
- [IFileSystemAccessTreeParams](interfaces/IFileSystemAccessTreeParams.md)
- [IFsAccessApis](interfaces/IFsAccessApis.md)
- [IHttpTreeParams](interfaces/IHttpTreeParams.md)
- [ILocalStorageTreeParams](interfaces/ILocalStorageTreeParams.md)
- [IUrlConfigOptions](interfaces/IUrlConfigOptions.md)
- [ShowDirectoryPickerOptions](interfaces/ShowDirectoryPickerOptions.md)
- [ShowOpenFilePickerOptions](interfaces/ShowOpenFilePickerOptions.md)
- [ShowSaveFilePickerOptions](interfaces/ShowSaveFilePickerOptions.md)

## Type Aliases

- [TreeInitializer](type-aliases/TreeInitializer.md)
- [WellKnownDirectory](type-aliases/WellKnownDirectory.md)
- [WindowWithFsAccess](type-aliases/WindowWithFsAccess.md)

## Variables

- [DEFAULT\_DIRECTORY\_HANDLE\_DB](variables/DEFAULT_DIRECTORY_HANDLE_DB.md)
- [DEFAULT\_DIRECTORY\_HANDLE\_STORE](variables/DEFAULT_DIRECTORY_HANDLE_STORE.md)

## Functions

- [exportAsJson](functions/exportAsJson.md)
- [exportUsingFileSystemAPI](functions/exportUsingFileSystemAPI.md)
- [extractDirectoryPath](functions/extractDirectoryPath.md)
- [isDirectoryHandle](functions/isDirectoryHandle.md)
- [isFileHandle](functions/isFileHandle.md)
- [isFilePath](functions/isFilePath.md)
- [parseContextFilter](functions/parseContextFilter.md)
- [parseQualifierDefaults](functions/parseQualifierDefaults.md)
- [parseResourceTypes](functions/parseResourceTypes.md)
- [parseUrlParameters](functions/parseUrlParameters.md)
- [safeShowDirectoryPicker](functions/safeShowDirectoryPicker.md)
- [safeShowOpenFilePicker](functions/safeShowOpenFilePicker.md)
- [safeShowSaveFilePicker](functions/safeShowSaveFilePicker.md)
- [supportsFileSystemAccess](functions/supportsFileSystemAccess.md)
