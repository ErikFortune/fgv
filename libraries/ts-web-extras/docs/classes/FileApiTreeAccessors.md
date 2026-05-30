[Home](../README.md) > FileApiTreeAccessors

# Class: FileApiTreeAccessors

Helper class to create FileTree instances from various file sources.
Supports File API (FileList) and File System Access API handles.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor()`

</td><td>



</td><td>



</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[createPersistent(dirHandle, params)](./FileApiTreeAccessors.createPersistent.md)

</td><td>

`static`

</td><td>

Create a persistent FileTree from a File System Access API directory handle.

</td></tr>
<tr><td>

[createFromHttp(params)](./FileApiTreeAccessors.createFromHttp.md)

</td><td>

`static`

</td><td>

Create a persistent FileTree from an HTTP storage service.

</td></tr>
<tr><td>

[createPersistentFromFile(fileHandle, params)](./FileApiTreeAccessors.createPersistentFromFile.md)

</td><td>

`static`

</td><td>

Create a persistent FileTree from a single File System Access API file handle.

</td></tr>
<tr><td>

[createFromLocalStorage(params)](./FileApiTreeAccessors.createFromLocalStorage.md)

</td><td>

`static`

</td><td>

Create a persistent FileTree from browser localStorage.

</td></tr>
<tr><td>

[create(initializers, params)](./FileApiTreeAccessors.create.md)

</td><td>

`static`

</td><td>

Create FileTree from various file sources using TreeInitializer array.

</td></tr>
<tr><td>

[fromFileList(fileList, params)](./FileApiTreeAccessors.fromFileList.md)

</td><td>

`static`

</td><td>

Create FileTree from FileList (e.g., from input[type="file"]).

</td></tr>
<tr><td>

[fromDirectoryUpload(fileList, params)](./FileApiTreeAccessors.fromDirectoryUpload.md)

</td><td>

`static`

</td><td>

Create FileTree from directory upload with webkitRelativePath.

</td></tr>
<tr><td>

[getOriginalFile(fileList, targetPath)](./FileApiTreeAccessors.getOriginalFile.md)

</td><td>

`static`

</td><td>

Get the File object for a specific path from the original FileList.

</td></tr>
<tr><td>

[extractFileMetadata(file)](./FileApiTreeAccessors.extractFileMetadata.md)

</td><td>

`static`

</td><td>

Extract file metadata from a File.

</td></tr>
</tbody></table>
