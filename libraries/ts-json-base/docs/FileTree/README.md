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

Implementation of FileTree.IMutableBinaryFileTreeAccessors that uses the

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

[IStrictTextFileTreeFileItem](./interfaces/IStrictTextFileTreeFileItem.md)

</td><td>

Extended file item interface for files whose text can be decoded **strictly**.

</td></tr>
<tr><td>

[IBinaryFileTreeFileItem](./interfaces/IBinaryFileTreeFileItem.md)

</td><td>

Extended file item interface for files whose contents can be read as raw bytes.

</td></tr>
<tr><td>

[IMutableFileTreeFileItem](./interfaces/IMutableFileTreeFileItem.md)

</td><td>

Extended file item interface that supports mutation operations.

</td></tr>
<tr><td>

[IMutableBinaryFileTreeFileItem](./interfaces/IMutableBinaryFileTreeFileItem.md)

</td><td>

Extended file item interface for files whose contents can be both read and written

</td></tr>
<tr><td>

[IFileTreeDirectoryItem](./interfaces/IFileTreeDirectoryItem.md)

</td><td>

Interface for a read-only directory in a file tree.

</td></tr>
<tr><td>

[IFileTreeStorageIdentity](./interfaces/IFileTreeStorageIdentity.md)

</td><td>

What storage a FileTree.IFileTreeDirectoryItem | directory item names.

</td></tr>
<tr><td>

[IMutableFileTreeDirectoryItem](./interfaces/IMutableFileTreeDirectoryItem.md)

</td><td>

Extended directory item interface that supports mutation operations.

</td></tr>
<tr><td>

[IMutableBinaryFileTreeDirectoryItem](./interfaces/IMutableBinaryFileTreeDirectoryItem.md)

</td><td>

Extended directory item interface for directories that can create a child file

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

[IBinaryFileTreeAccessors](./interfaces/IBinaryFileTreeAccessors.md)

</td><td>

Extended accessors interface for trees whose file contents can be read as raw bytes.

</td></tr>
<tr><td>

[IMutableBinaryFileTreeAccessors](./interfaces/IMutableBinaryFileTreeAccessors.md)

</td><td>

Extended accessors interface for trees whose file contents can be both read and

</td></tr>
<tr><td>

[IPersistentFileTreeAccessors](./interfaces/IPersistentFileTreeAccessors.md)

</td><td>

Extended accessors interface that supports persistence operations.

</td></tr>
<tr><td>

[IAtomicWriteCapabilities](./interfaces/IAtomicWriteCapabilities.md)

</td><td>

Reports what atomic replacement a directory's backing store can actually

</td></tr>
<tr><td>

[IAtomicWriteOptions](./interfaces/IAtomicWriteOptions.md)

</td><td>

Options controlling an atomic write.

</td></tr>
<tr><td>

[IAtomicWriteReceipt](./interfaces/IAtomicWriteReceipt.md)

</td><td>

Receipt returned by a successful atomic write.

</td></tr>
<tr><td>

[IAtomicWriteFailure](./interfaces/IAtomicWriteFailure.md)

</td><td>

Classified detail for a failed atomic write.

</td></tr>
<tr><td>

[IAtomicFileTreeAccessors](./interfaces/IAtomicFileTreeAccessors.md)

</td><td>

Extended accessors interface for trees that can replace a file's contents

</td></tr>
<tr><td>

[IAtomicFileTreeDirectoryItem](./interfaces/IAtomicFileTreeDirectoryItem.md)

</td><td>

Extended directory item interface for directories that can atomically

</td></tr>
<tr><td>

[IStrictTextFileTreeAccessors](./interfaces/IStrictTextFileTreeAccessors.md)

</td><td>

Extended accessors for stores that can decode a file's text **strictly** —

</td></tr>
<tr><td>

[ICopyOptions](./interfaces/ICopyOptions.md)

</td><td>

Options for FileTree.copyItemInto | copyItemInto and

</td></tr>
<tr><td>

[ISkippedCopyFile](./interfaces/ISkippedCopyFile.md)

</td><td>

A file a copy left behind under

</td></tr>
<tr><td>

[ICopyReport](./interfaces/ICopyReport.md)

</td><td>

What a copy did.

</td></tr>
<tr><td>

[IInMemoryFile](./interfaces/IInMemoryFile.md)

</td><td>

Represents a single file in an in-memory FileTree | file tree.

</td></tr>
<tr><td>

[IFsFileTreeInitParams](./interfaces/IFsFileTreeInitParams.md)

</td><td>

Initialization parameters for FileTree.FsFileTreeAccessors | FsFileTreeAccessors.

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
<tr><td>

[AtomicWriteGuarantee](./type-aliases/AtomicWriteGuarantee.md)

</td><td>

Durability guarantee an atomic write claims to honor.

</td></tr>
<tr><td>

[CopyUnfaithfulFileBehavior](./type-aliases/CopyUnfaithfulFileBehavior.md)

</td><td>

What a copy does with a file it cannot carry byte-faithfully.

</td></tr>
<tr><td>

[FsAbsolutePathPolicy](./type-aliases/FsAbsolutePathPolicy.md)

</td><td>

How FileTree.FsFileTreeAccessors | FsFileTreeAccessors treats a path

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

[isBinaryAccessors](./functions/isBinaryAccessors.md)

</td><td>

Type guard to check if accessors support reading raw bytes.

</td></tr>
<tr><td>

[isStrictTextAccessors](./functions/isStrictTextAccessors.md)

</td><td>

Narrows accessors to FileTree.IStrictTextFileTreeAccessors.

</td></tr>
<tr><td>

[isMutableBinaryAccessors](./functions/isMutableBinaryAccessors.md)

</td><td>

Type guard to check if accessors support both reading and writing raw bytes.

</td></tr>
<tr><td>

[isAtomicAccessors](./functions/isAtomicAccessors.md)

</td><td>

Type guard to check if accessors support atomic writes.

</td></tr>
<tr><td>

[isBinaryFileItem](./functions/isBinaryFileItem.md)

</td><td>

Type guard narrowing a file item to FileTree.IBinaryFileTreeFileItem.

</td></tr>
<tr><td>

[isStrictTextFileItem](./functions/isStrictTextFileItem.md)

</td><td>

Narrows a file item to FileTree.IStrictTextFileTreeFileItem.

</td></tr>
<tr><td>

[isMutableBinaryFileItem](./functions/isMutableBinaryFileItem.md)

</td><td>

Type guard narrowing a file item to FileTree.IMutableBinaryFileTreeFileItem.

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

[isMutableBinaryDirectoryItem](./functions/isMutableBinaryDirectoryItem.md)

</td><td>

Type guard narrowing a directory item to

</td></tr>
<tr><td>

[isAtomicDirectoryItem](./functions/isAtomicDirectoryItem.md)

</td><td>

Type guard narrowing a directory item to FileTree.IAtomicFileTreeDirectoryItem.

</td></tr>
<tr><td>

[copyItemInto](./functions/copyItemInto.md)

</td><td>

Copies an item into a destination directory as a child of the same name, recursing for

</td></tr>
<tr><td>

[copyContentsInto](./functions/copyContentsInto.md)

</td><td>

Copies every child of a source directory into a destination directory, recursing for
subdirectories.

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

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[atomicWriteGuarantees](./variables/atomicWriteGuarantees.md)

</td><td>

Every FileTree.AtomicWriteGuarantee | atomic write guarantee, ordered

</td></tr>
<tr><td>

[allFsAbsolutePathPolicies](./variables/allFsAbsolutePathPolicies.md)

</td><td>

Every FileTree.FsAbsolutePathPolicy | FsAbsolutePathPolicy, in order of

</td></tr>
</tbody></table>
