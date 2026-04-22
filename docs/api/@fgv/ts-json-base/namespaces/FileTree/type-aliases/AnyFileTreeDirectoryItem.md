[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / AnyFileTreeDirectoryItem

# Type Alias: AnyFileTreeDirectoryItem\<TCT\>

> **AnyFileTreeDirectoryItem**\<`TCT`\> = [`IFileTreeDirectoryItem`](../interfaces/IFileTreeDirectoryItem.md)\<`TCT`\> \| [`IMutableFileTreeDirectoryItem`](../interfaces/IMutableFileTreeDirectoryItem.md)\<`TCT`\>

A directory item that may or may not be mutable at runtime.

Use this type for parameters or fields where the code checks for mutability
and handles the read-only case gracefully. Use [FileTree.IMutableFileTreeDirectoryItem](../interfaces/IMutableFileTreeDirectoryItem.md)
when mutation is required.

Narrow with [FileTree.isMutableDirectoryItem](../functions/isMutableDirectoryItem.md) to access mutation methods.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |
