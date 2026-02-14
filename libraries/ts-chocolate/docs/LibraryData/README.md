[Home](../README.md) > LibraryData

# Namespace: LibraryData

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Converters](./Converters/README.md)

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

[CollectionFilter](./classes/CollectionFilter.md)

</td><td>

Generic collection import filter.

</td></tr>
<tr><td>

[CollectionLoader](./classes/CollectionLoader.md)

</td><td>

Loads collections from a file tree, validating with supplied converters and filtering as specified.

</td></tr>
<tr><td>

[SubLibraryBase](./classes/SubLibraryBase.md)

</td><td>

Base class for sub-libraries that use SourceId as the collection ID.

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

[IEncryptedCollectionMetadata](./interfaces/IEncryptedCollectionMetadata.md)

</td><td>

Optional unencrypted metadata for encrypted collection files.

</td></tr>
<tr><td>

[ICollectionSourceMetadata](./interfaces/ICollectionSourceMetadata.md)

</td><td>

Optional metadata for collection source files.

</td></tr>
<tr><td>

[ICollectionSourceFile](./interfaces/ICollectionSourceFile.md)

</td><td>

Structure of collection source files (YAML/JSON).

</td></tr>
<tr><td>

[ILibraryLoadParams](./interfaces/ILibraryLoadParams.md)

</td><td>

Fine-grained parameters for controlling which collections from a library to load.

</td></tr>
<tr><td>

[ICollection](./interfaces/ICollection.md)

</td><td>

Representation of a collection of items as serialized data.

</td></tr>
<tr><td>

[IRuntimeCollection](./interfaces/IRuntimeCollection.md)

</td><td>

Runtime representation of a collection loaded from a FileTree.

</td></tr>
<tr><td>

[IFileTreeSource](./interfaces/IFileTreeSource.md)

</td><td>

Specifies a file tree source for a single sub-library (ingredients or recipes).

</td></tr>
<tr><td>

[ILibraryFileTreeSource](./interfaces/ILibraryFileTreeSource.md)

</td><td>

Specifies a file tree source for the full library (all sub-libraries).

</td></tr>
<tr><td>

[IMergeLibrarySource](./interfaces/IMergeLibrarySource.md)

</td><td>

Specifies a library to merge with optional collection filtering.

</td></tr>
<tr><td>

[IEncryptionConfig](./interfaces/IEncryptionConfig.md)

</td><td>

Configuration for handling encrypted collections during loading.

</td></tr>
<tr><td>

[IProtectedCollectionInfo](./interfaces/IProtectedCollectionInfo.md)

</td><td>

Public reference to a protected (encrypted) collection that was captured
during loading but not decrypted due to missing keys.

</td></tr>
<tr><td>

[ICollectionLoadResult](./interfaces/ICollectionLoadResult.md)

</td><td>

Result of loading collections from a file tree.

</td></tr>
<tr><td>

[IImportRootCandidate](./interfaces/IImportRootCandidate.md)

</td><td>

A candidate import root with directory and resolution kind.

</td></tr>
<tr><td>

[IResolvedImportRoot](./interfaces/IResolvedImportRoot.md)

</td><td>

Result of importing a directory for a specific sub-library.

</td></tr>
<tr><td>

[IResolveImportRootOptions](./interfaces/IResolveImportRootOptions.md)

</td><td>

Options for importing a directory for a specific sub-library.

</td></tr>
<tr><td>

[ICollectionFilterInitParams](./interfaces/ICollectionFilterInitParams.md)

</td><td>

Parameters used to filter and validate collections imported from a file tree.

</td></tr>
<tr><td>

[IFilterDirectoryParams](./interfaces/IFilterDirectoryParams.md)

</td><td>

Parameters used to filter a directory.

</td></tr>
<tr><td>

[IFilteredItem](./interfaces/IFilteredItem.md)

</td><td>

Result of filtering a collection of items.

</td></tr>
<tr><td>

[ICollectionLoaderInitParams](./interfaces/ICollectionLoaderInitParams.md)

</td><td>

Parameters used to initialize a LibraryData.CollectionLoader | CollectionLoader.

</td></tr>
<tr><td>

[ILoadCollectionFromFileTreeParams](./interfaces/ILoadCollectionFromFileTreeParams.md)

</td><td>

Parameters used to load collections from a file tree.

</td></tr>
<tr><td>

[IResolvedSubLibrarySource](./interfaces/IResolvedSubLibrarySource.md)

</td><td>

Result of resolving a file tree source for a specific sub-library.

</td></tr>
<tr><td>

[ICollectionSet](./interfaces/ICollectionSet.md)

</td><td>

A collection set for collision detection.

</td></tr>
<tr><td>

[INormalizedMergeSource](./interfaces/INormalizedMergeSource.md)

</td><td>

Normalized result from a merge source.

</td></tr>
<tr><td>

[ISubLibraryParams](./interfaces/ISubLibraryParams.md)

</td><td>

Parameters for creating a sub-library instance.

</td></tr>
<tr><td>

[ISubLibraryAsyncParams](./interfaces/ISubLibraryAsyncParams.md)

</td><td>

Parameters for creating a sub-library instance asynchronously.

</td></tr>
<tr><td>

[ISubLibraryAsyncLoadResult](./interfaces/ISubLibraryAsyncLoadResult.md)

</td><td>

Result from async collection loading operations.

</td></tr>
<tr><td>

[ISubLibraryCreateParams](./interfaces/ISubLibraryCreateParams.md)

</td><td>

Parameters for constructing a SubLibrary with full loading support.

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

[EncryptedCollectionFile](./type-aliases/EncryptedCollectionFile.md)

</td><td>

Encrypted collection file format - an encrypted file with collection-specific metadata.

</td></tr>
<tr><td>

[FilterPattern](./type-aliases/FilterPattern.md)

</td><td>

A pattern for matching collection or item names.

</td></tr>
<tr><td>

[LibraryLoadSpec](./type-aliases/LibraryLoadSpec.md)

</td><td>

Specifies which collections from a library should be loaded.

</td></tr>
<tr><td>

[MutabilitySpec](./type-aliases/MutabilitySpec.md)

</td><td>

Specifies which collections should be mutable.

</td></tr>
<tr><td>

[SubLibraryId](./type-aliases/SubLibraryId.md)

</td><td>

Identifiers for sub-libraries within the chocolate library system.

</td></tr>
<tr><td>

[FullLibraryLoadSpec](./type-aliases/FullLibraryLoadSpec.md)

</td><td>

Controls loading for each sub-library within a library source.

</td></tr>
<tr><td>

[SecretProvider](./type-aliases/SecretProvider.md)

</td><td>

Function type for providing encryption keys by secret name.

</td></tr>
<tr><td>

[ImportRootKind](./type-aliases/ImportRootKind.md)

</td><td>

Specifies how a directory was resolved for import.

</td></tr>
<tr><td>

[EncryptedFileHandling](./type-aliases/EncryptedFileHandling.md)

</td><td>

How to handle encrypted files in synchronous loading.

</td></tr>
<tr><td>

[SubLibraryCollectionEntry](./type-aliases/SubLibraryCollectionEntry.md)

</td><td>

A single entry in a sub-library collection.

</td></tr>
<tr><td>

[SubLibraryEntryInit](./type-aliases/SubLibraryEntryInit.md)

</td><td>

Initialization type for a sub-library collection entry.

</td></tr>
<tr><td>

[SubLibraryCollectionValidator](./type-aliases/SubLibraryCollectionValidator.md)

</td><td>

Validator type for sub-library collections.

</td></tr>
<tr><td>

[SubLibraryCollection](./type-aliases/SubLibraryCollection.md)

</td><td>

Type for the collections map in a sub-library.

</td></tr>
<tr><td>

[SubLibraryFileTreeSource](./type-aliases/SubLibraryFileTreeSource.md)

</td><td>

File tree source for sub-library data.

</td></tr>
<tr><td>

[SubLibraryMergeSource](./type-aliases/SubLibraryMergeSource.md)

</td><td>

Specifies a sub-library to merge into a new library.

</td></tr>
<tr><td>

[SubLibraryDirectoryNavigator](./type-aliases/SubLibraryDirectoryNavigator.md)

</td><td>

Function that navigates from library root to the appropriate data directory.

</td></tr>
<tr><td>

[SubLibraryBuiltInTreeProvider](./type-aliases/SubLibraryBuiltInTreeProvider.md)

</td><td>

Function that provides the built-in library tree.

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

[isEncryptedCollectionFile](./functions/isEncryptedCollectionFile.md)

</td><td>

Checks if a JSON object appears to be an encrypted collection file.

</td></tr>
<tr><td>

[resolveSubLibraryLoadSpec](./functions/resolveSubLibraryLoadSpec.md)

</td><td>

Resolves a FullLibraryLoadSpec to a LibraryLoadSpec for a specific sub-library.

</td></tr>
<tr><td>

[createFilterFromSpec](./functions/createFilterFromSpec.md)

</td><td>

Creates a CollectionFilter from a LibraryLoadSpec.

</td></tr>
<tr><td>

[navigateToDirectory](./functions/navigateToDirectory.md)

</td><td>

Navigates to a subdirectory within a FileTree by path.

</td></tr>
<tr><td>

[getIngredientsDirectory](./functions/getIngredientsDirectory.md)

</td><td>

Gets the ingredients directory from a library tree.

</td></tr>
<tr><td>

[getFillingsDirectory](./functions/getFillingsDirectory.md)

</td><td>

Gets the fillings directory from a library tree.

</td></tr>
<tr><td>

[getJournalsDirectory](./functions/getJournalsDirectory.md)

</td><td>

Gets the journals directory from a library tree.

</td></tr>
<tr><td>

[getMoldsDirectory](./functions/getMoldsDirectory.md)

</td><td>

Gets the molds directory from a library tree.

</td></tr>
<tr><td>

[getProceduresDirectory](./functions/getProceduresDirectory.md)

</td><td>

Gets the procedures directory from a library tree.

</td></tr>
<tr><td>

[getTasksDirectory](./functions/getTasksDirectory.md)

</td><td>

Gets the tasks directory from a library tree.

</td></tr>
<tr><td>

[getConfectionsDirectory](./functions/getConfectionsDirectory.md)

</td><td>

Gets the confections directory from a library tree.

</td></tr>
<tr><td>

[getDecorationsDirectory](./functions/getDecorationsDirectory.md)

</td><td>

Gets the decorations directory from a library tree.

</td></tr>
<tr><td>

[getSessionsDirectory](./functions/getSessionsDirectory.md)

</td><td>

Gets the sessions directory from a library tree.

</td></tr>
<tr><td>

[getMoldInventoryDirectory](./functions/getMoldInventoryDirectory.md)

</td><td>

Gets the mold inventory directory from a library tree.

</td></tr>
<tr><td>

[getIngredientInventoryDirectory](./functions/getIngredientInventoryDirectory.md)

</td><td>

Gets the ingredient inventory directory from a library tree.

</td></tr>
<tr><td>

[createDefaultLibraryDirectories](./functions/createDefaultLibraryDirectories.md)

</td><td>

Creates the standard library data directories at the given root path.

</td></tr>
<tr><td>

[specToLoadParams](./functions/specToLoadParams.md)

</td><td>

Converts a LibraryLoadSpec to ILoadCollectionFromFileTreeParams.

</td></tr>
<tr><td>

[getSubLibraryPath](./functions/getSubLibraryPath.md)

</td><td>

Gets the directory path for a sub-library.

</td></tr>
<tr><td>

[navigateToSubLibrary](./functions/navigateToSubLibrary.md)

</td><td>

Navigates to a sub-library directory within a file tree.

</td></tr>
<tr><td>

[resolveFileTreeSourceForSubLibrary](./functions/resolveFileTreeSourceForSubLibrary.md)

</td><td>

Resolves a file tree source for a specific sub-library.

</td></tr>
<tr><td>

[resolveFileTreeSource](./functions/resolveFileTreeSource.md)

</td><td>

Resolves all sub-libraries from a file tree source.

</td></tr>
<tr><td>

[resolveBuiltInSpec](./functions/resolveBuiltInSpec.md)

</td><td>

Resolves a FullLibraryLoadSpec for built-in loading to individual sub-library specs.

</td></tr>
<tr><td>

[checkForCollisionIds](./functions/checkForCollisionIds.md)

</td><td>

Checks for duplicate collection IDs across multiple sources.

</td></tr>
<tr><td>

[normalizeFileSources](./functions/normalizeFileSources.md)

</td><td>

Normalizes a file sources parameter to an array.

</td></tr>
<tr><td>

[isMergeLibrarySource](./functions/isMergeLibrarySource.md)

</td><td>

Type guard to check if a value is an IMergeLibrarySource.

</td></tr>
<tr><td>

[normalizeMergeSource](./functions/normalizeMergeSource.md)

</td><td>

Normalizes a merge source (library or {library, filter}) to a consistent shape.

</td></tr>
<tr><td>

[resolveImportRootForSubLibrary](./functions/resolveImportRootForSubLibrary.md)

</td><td>

Resolves a directory that can be treated as a library root for a specific sub-library.

</td></tr>
<tr><td>

[resolveImportRootForLibrary](./functions/resolveImportRootForLibrary.md)

</td><td>

Resolves a directory that can be treated as a library root for any sub-libraries.

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

[allSubLibraryIds](./variables/allSubLibraryIds.md)

</td><td>

All valid sub-library identifiers.

</td></tr>
<tr><td>

[LibraryPaths](./variables/LibraryPaths.md)

</td><td>

Canonical paths within a chocolate library tree.

</td></tr>
</tbody></table>
