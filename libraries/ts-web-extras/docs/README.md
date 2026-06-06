# @fgv/ts-web-extras

Browser-compatible utilities and FileTree implementations.

This library provides browser-compatible alternatives to Node.js-specific functionality,
including Web Crypto API-based hashing, File API-based file tree implementations,
and URL parameter parsing utilities.
All exports are designed to be tree-shakeable for optimal bundle size.

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[CryptoUtils](./CryptoUtils/README.md)

</td><td>

Browser-compatible cryptographic utilities using the Web Crypto API.

</td></tr>
<tr><td>

[FileTreeHelpers](./FileTreeHelpers/README.md)

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

[DirectoryHandleStore](./classes/DirectoryHandleStore.md)

</td><td>

Manages persistence of FileSystemDirectoryHandle objects in IndexedDB.

</td></tr>
<tr><td>

[FileApiTreeAccessors](./classes/FileApiTreeAccessors.md)

</td><td>

Helper class to create FileTree instances from various file sources.

</td></tr>
<tr><td>

[FileSystemAccessTreeAccessors](./classes/FileSystemAccessTreeAccessors.md)

</td><td>

Implementation of `FileTree.IPersistentFileTreeAccessors` that uses the File System Access API

</td></tr>
<tr><td>

[HttpTreeAccessors](./classes/HttpTreeAccessors.md)

</td><td>

HTTP-backed file tree accessors that cache data in memory and persist via REST API.

</td></tr>
<tr><td>

[LocalStorageTreeAccessors](./classes/LocalStorageTreeAccessors.md)

</td><td>

Browser localStorage-backed file tree accessors with persistence support.

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

[IFileListTreeInitializer](./interfaces/IFileListTreeInitializer.md)

</td><td>

Tree initializer for FileList objects (from File API).

</td></tr>
<tr><td>

[IFileHandleTreeInitializer](./interfaces/IFileHandleTreeInitializer.md)

</td><td>

Tree initializer for File System Access API file handles.

</td></tr>
<tr><td>

[IDirectoryHandleTreeInitializer](./interfaces/IDirectoryHandleTreeInitializer.md)

</td><td>

Tree initializer for File System Access API directory handles.

</td></tr>
<tr><td>

[IFileMetadata](./interfaces/IFileMetadata.md)

</td><td>

Interface for file metadata.

</td></tr>
<tr><td>

[IFileSystemAccessTreeParams](./interfaces/IFileSystemAccessTreeParams.md)

</td><td>

Options for creating persistent file trees.

</td></tr>
<tr><td>

[IHttpTreeParams](./interfaces/IHttpTreeParams.md)

</td><td>

Configuration for creating HTTP-backed tree accessors.

</td></tr>
<tr><td>

[ILocalStorageTreeParams](./interfaces/ILocalStorageTreeParams.md)

</td><td>

Configuration for LocalStorageTreeAccessors.

</td></tr>
<tr><td>

[IFsAccessApis](./interfaces/IFsAccessApis.md)

</td><td>

File System Access API methods available on Window

</td></tr>
<tr><td>

[FileSystemHandle](./interfaces/FileSystemHandle.md)

</td><td>

Base interface for file system handles

</td></tr>
<tr><td>

[FileSystemFileHandle](./interfaces/FileSystemFileHandle.md)

</td><td>

File handle interface

</td></tr>
<tr><td>

[FileSystemDirectoryHandle](./interfaces/FileSystemDirectoryHandle.md)

</td><td>

Directory handle interface

</td></tr>
<tr><td>

[FileSystemHandlePermissionDescriptor](./interfaces/FileSystemHandlePermissionDescriptor.md)

</td><td>

Permission descriptor for file system handles

</td></tr>
<tr><td>

[FileSystemCreateWritableOptions](./interfaces/FileSystemCreateWritableOptions.md)

</td><td>

Options for creating writable file streams

</td></tr>
<tr><td>

[FileSystemGetDirectoryOptions](./interfaces/FileSystemGetDirectoryOptions.md)

</td><td>

Options for getting directory handles

</td></tr>
<tr><td>

[FileSystemGetFileOptions](./interfaces/FileSystemGetFileOptions.md)

</td><td>

Options for getting file handles

</td></tr>
<tr><td>

[FileSystemRemoveOptions](./interfaces/FileSystemRemoveOptions.md)

</td><td>

Options for removing entries

</td></tr>
<tr><td>

[FileSystemWritableFileStream](./interfaces/FileSystemWritableFileStream.md)

</td><td>

Writable file stream interface

</td></tr>
<tr><td>

[ShowDirectoryPickerOptions](./interfaces/ShowDirectoryPickerOptions.md)

</td><td>

Directory picker options

</td></tr>
<tr><td>

[ShowOpenFilePickerOptions](./interfaces/ShowOpenFilePickerOptions.md)

</td><td>

File picker options

</td></tr>
<tr><td>

[ShowSaveFilePickerOptions](./interfaces/ShowSaveFilePickerOptions.md)

</td><td>

Save file picker options

</td></tr>
<tr><td>

[FilePickerAcceptType](./interfaces/FilePickerAcceptType.md)

</td><td>

File picker accept type

</td></tr>
<tr><td>

[IUrlConfigOptions](./interfaces/IUrlConfigOptions.md)

</td><td>

Configuration options that can be passed via URL parameters

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

[TreeInitializer](./type-aliases/TreeInitializer.md)

</td><td>

Union type for all supported tree initializers.

</td></tr>
<tr><td>

[WindowWithFsAccess](./type-aliases/WindowWithFsAccess.md)

</td><td>

Window interface extended with File System Access API

</td></tr>
<tr><td>

[WellKnownDirectory](./type-aliases/WellKnownDirectory.md)

</td><td>

Well-known directory type

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

[supportsFileSystemAccess](./functions/supportsFileSystemAccess.md)

</td><td>

Type guard to check if the browser supports the File System Access API

</td></tr>
<tr><td>

[isFileHandle](./functions/isFileHandle.md)

</td><td>

Type guard to check if a FileSystemHandle is a file handle

</td></tr>
<tr><td>

[isDirectoryHandle](./functions/isDirectoryHandle.md)

</td><td>

Type guard to check if a FileSystemHandle is a directory handle

</td></tr>
<tr><td>

[safeShowOpenFilePicker](./functions/safeShowOpenFilePicker.md)

</td><td>

Safely access showOpenFilePicker with proper type checking

</td></tr>
<tr><td>

[safeShowSaveFilePicker](./functions/safeShowSaveFilePicker.md)

</td><td>

Safely access showSaveFilePicker with proper type checking

</td></tr>
<tr><td>

[safeShowDirectoryPicker](./functions/safeShowDirectoryPicker.md)

</td><td>

Safely access showDirectoryPicker with proper type checking

</td></tr>
<tr><td>

[exportAsJson](./functions/exportAsJson.md)

</td><td>

Export data as JSON file using legacy blob download method.

</td></tr>
<tr><td>

[exportUsingFileSystemAPI](./functions/exportUsingFileSystemAPI.md)

</td><td>

Export data using File System Access API with fallback to blob download.

</td></tr>
<tr><td>

[parseUrlParameters](./functions/parseUrlParameters.md)

</td><td>

Parses URL parameters and extracts configuration options

</td></tr>
<tr><td>

[parseContextFilter](./functions/parseContextFilter.md)

</td><td>

Converts context filter token to context object

</td></tr>
<tr><td>

[parseQualifierDefaults](./functions/parseQualifierDefaults.md)

</td><td>

Converts qualifier defaults token to structured format

</td></tr>
<tr><td>

[parseResourceTypes](./functions/parseResourceTypes.md)

</td><td>

Converts resource types string to array

</td></tr>
<tr><td>

[extractDirectoryPath](./functions/extractDirectoryPath.md)

</td><td>

Extracts the directory path from a file or directory path

</td></tr>
<tr><td>

[isFilePath](./functions/isFilePath.md)

</td><td>

Determines if a path appears to be a file (has extension) or directory

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

[DEFAULT_DIRECTORY_HANDLE_DB](./variables/DEFAULT_DIRECTORY_HANDLE_DB.md)

</td><td>

Default IndexedDB database name for directory handles.

</td></tr>
<tr><td>

[DEFAULT_DIRECTORY_HANDLE_STORE](./variables/DEFAULT_DIRECTORY_HANDLE_STORE.md)

</td><td>

Default IndexedDB store name for directory handles.

</td></tr>
</tbody></table>
