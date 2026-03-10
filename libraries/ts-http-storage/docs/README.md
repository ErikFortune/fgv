# @fgv/ts-http-storage

Reusable HTTP storage services for FileTree-style backends.

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[FsStorageProvider](./classes/FsStorageProvider.md)

</td><td>

Filesystem-backed implementation of IHttpStorageProvider.

</td></tr>
<tr><td>

[FsStorageProviderFactory](./classes/FsStorageProviderFactory.md)

</td><td>

Namespace-aware provider factory backed by filesystem directories.

</td></tr>
<tr><td>

[HttpStorageService](./classes/HttpStorageService.md)

</td><td>

Service layer for storage API operations.

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

[IStorageTreeItem](./interfaces/IStorageTreeItem.md)

</td><td>

Storage tree item metadata.

</td></tr>
<tr><td>

[IStorageTreeChildrenResponse](./interfaces/IStorageTreeChildrenResponse.md)

</td><td>

Response for listing children.

</td></tr>
<tr><td>

[IStorageFileResponse](./interfaces/IStorageFileResponse.md)

</td><td>

Response for reading a file.

</td></tr>
<tr><td>

[IStoragePathRequest](./interfaces/IStoragePathRequest.md)

</td><td>

Request for path-based operations.

</td></tr>
<tr><td>

[IStorageWriteFileRequest](./interfaces/IStorageWriteFileRequest.md)

</td><td>

Request for writing file contents.

</td></tr>
<tr><td>

[IStorageSyncRequest](./interfaces/IStorageSyncRequest.md)

</td><td>

Request for sync operation.

</td></tr>
<tr><td>

[IStorageSyncResponse](./interfaces/IStorageSyncResponse.md)

</td><td>

Sync response metadata.

</td></tr>
<tr><td>

[IHttpStorageProvider](./interfaces/IHttpStorageProvider.md)

</td><td>

Provider contract for storage backends.

</td></tr>
<tr><td>

[IHttpStorageProviderFactory](./interfaces/IHttpStorageProviderFactory.md)

</td><td>

Factory for creating namespace-scoped storage providers.

</td></tr>
<tr><td>

[IFsStorageProviderFactoryOptions](./interfaces/IFsStorageProviderFactoryOptions.md)

</td><td>

Options for creating filesystem-backed storage providers.

</td></tr>
<tr><td>

[ICreateStorageRoutesOptions](./interfaces/ICreateStorageRoutesOptions.md)

</td><td>

Options for creating storage routes.

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

[StorageNamespace](./type-aliases/StorageNamespace.md)

</td><td>

Namespace identifier for scoped storage.

</td></tr>
<tr><td>

[StorageItemType](./type-aliases/StorageItemType.md)

</td><td>

Storage item type.

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

[sanitizeNamespace](./functions/sanitizeNamespace.md)

</td><td>

Sanitize namespace path segment.

</td></tr>
<tr><td>

[createStorageRoutes](./functions/createStorageRoutes.md)

</td><td>

Builds storage routes for a Hono app.

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

[storageTreeItem](./variables/storageTreeItem.md)

</td><td>

Converter for IStorageTreeItem.

</td></tr>
<tr><td>

[storagePathRequest](./variables/storagePathRequest.md)

</td><td>

Converter for path-based requests.

</td></tr>
<tr><td>

[storageWriteFileRequest](./variables/storageWriteFileRequest.md)

</td><td>

Converter for write-file requests.

</td></tr>
<tr><td>

[storageSyncRequest](./variables/storageSyncRequest.md)

</td><td>

Converter for sync requests.

</td></tr>
<tr><td>

[storageFileResponse](./variables/storageFileResponse.md)

</td><td>

Converter for file responses.

</td></tr>
<tr><td>

[storageTreeChildrenResponse](./variables/storageTreeChildrenResponse.md)

</td><td>

Converter for children list responses.

</td></tr>
</tbody></table>
