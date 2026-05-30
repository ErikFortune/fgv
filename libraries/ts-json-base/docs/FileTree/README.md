[Home](../README.md) > FileTree

# Namespace: FileTree

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[FileTree](./classes/FileTree.md)

</td><td>

Represents a file tree.

</td></tr>
<tr><td>

[DirectoryItem](./classes/DirectoryItem.md)

</td><td>

Class representing a directory in a file tree.

</td></tr>
<tr><td>

[FileItem](./classes/FileItem.md)

</td><td>

Class representing a file in a file tree.

</td></tr>
<tr><td>

[InMemoryTreeAccessors](./classes/InMemoryTreeAccessors.md)

</td><td>

Implementation of FileTree.IMutableFileTreeAccessors that uses an in-memory

</td></tr>
<tr><td>

[FsFileTreeAccessors](./classes/FsFileTreeAccessors.md)

</td><td>

Implementation of FileTree.IMutableFileTreeAccessors that uses the

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

[IFilterSpec](./interfaces/IFilterSpec.md)

</td><td>

Filter specification for controlling which paths are mutable.

</td></tr>
<tr><td>

[IFileTreeInitParams](./interfaces/IFileTreeInitParams.md)

</td><td>

Initialization parameters for a file tree.

</td></tr>
<tr><td>

[IDeleteChildOptions](./interfaces/IDeleteChildOptions.md)

</td><td>

Options for deleting a child item from a directory.

</td></tr>
<tr><td>

[IFileTreeFileItem](./interfaces/IFileTreeFileItem.md)

</td><td>

Interface for a read-only file in a file tree.

</td></tr>
<tr><td>

[IMutableFileTreeFileItem](./interfaces/IMutableFileTreeFileItem.md)

</td><td>

Extended file item interface that supports mutation operations.

</td></tr>
<tr><td>

[IFileTreeDirectoryItem](./interfaces/IFileTreeDirectoryItem.md)

</td><td>

Interface for a read-only directory in a file tree.

</td></tr>
<tr><td>

[IMutableFileTreeDirectoryItem](./interfaces/IMutableFileTreeDirectoryItem.md)

</td><td>

Extended directory item interface that supports mutation operations.

</td></tr>
<tr><td>

[IFileTreeAccessors](./interfaces/IFileTreeAccessors.md)

</td><td>

Common abstraction layer interface for a tree of files
(e.g.

</td></tr>
<tr><td>

[IMutableFileTreeAccessors](./interfaces/IMutableFileTreeAccessors.md)

</td><td>

Extended accessors interface that supports mutation operations.

</td></tr>
<tr><td>

[IPersistentFileTreeAccessors](./interfaces/IPersistentFileTreeAccessors.md)

</td><td>

Extended accessors interface that supports persistence operations.

</td></tr>
<tr><td>

[IInMemoryFile](./interfaces/IInMemoryFile.md)

</td><td>

Represents a single file in an in-memory FileTree | file tree.

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

[SaveCapability](./type-aliases/SaveCapability.md)

</td><td>

Indicates the persistence capability of a save operation.

</td></tr>
<tr><td>

[SaveFailureReason](./type-aliases/SaveFailureReason.md)

</td><td>

Indicates the reason a save operation cannot be performed.

</td></tr>
<tr><td>

[SaveDetail](./type-aliases/SaveDetail.md)

</td><td>

Detail type for getIsMutable results.

</td></tr>
<tr><td>

[FileTreeItemType](./type-aliases/FileTreeItemType.md)

</td><td>

Type of item in a file tree.

</td></tr>
<tr><td>

[ContentTypeFactory](./type-aliases/ContentTypeFactory.md)

</td><td>

Type of function to infer the content type of a file.

</td></tr>
<tr><td>

[FileTreeItem](./type-aliases/FileTreeItem.md)

</td><td>

Type for an item in a file tree.

</td></tr>
<tr><td>

[MutableFileTreeItem](./type-aliases/MutableFileTreeItem.md)

</td><td>

Type for a mutable item in a file tree.

</td></tr>
<tr><td>

[AnyFileTreeFileItem](./type-aliases/AnyFileTreeFileItem.md)

</td><td>

A file item that may or may not be mutable at runtime.

</td></tr>
<tr><td>

[AnyFileTreeDirectoryItem](./type-aliases/AnyFileTreeDirectoryItem.md)

</td><td>

A directory item that may or may not be mutable at runtime.

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

[isMutableAccessors](./functions/isMutableAccessors.md)

</td><td>

Type guard to check if accessors support mutation.

</td></tr>
<tr><td>

[isPersistentAccessors](./functions/isPersistentAccessors.md)

</td><td>

Type guard to check if accessors support persistence.

</td></tr>
<tr><td>

[isMutableFileItem](./functions/isMutableFileItem.md)

</td><td>

Type guard to check if a file item supports mutation.

</td></tr>
<tr><td>

[isMutableDirectoryItem](./functions/isMutableDirectoryItem.md)

</td><td>

Type guard to check if a directory item supports mutation.

</td></tr>
<tr><td>

[isPathMutable](./functions/isPathMutable.md)

</td><td>

Checks if a path is allowed by a mutability configuration.

</td></tr>
<tr><td>

[forFilesystem](./functions/forFilesystem.md)

</td><td>

Helper function to create a new FileTree.FileTree | FileTree instance

</td></tr>
<tr><td>

[inMemory](./functions/inMemory.md)

</td><td>

Helper function to create a new FileTree.FileTree | FileTree instance

</td></tr>
</tbody></table>
