[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / AnyFileTreeFileItem

# Type Alias: AnyFileTreeFileItem\<TCT\>

> **AnyFileTreeFileItem**\<`TCT`\> = [`IFileTreeFileItem`](../interfaces/IFileTreeFileItem.md)\<`TCT`\> \| [`IMutableFileTreeFileItem`](../interfaces/IMutableFileTreeFileItem.md)\<`TCT`\>

A file item that may or may not be mutable at runtime.

Use this type for parameters or fields where the code checks for mutability
and handles the read-only case gracefully. Use [FileTree.IMutableFileTreeFileItem](../interfaces/IMutableFileTreeFileItem.md)
when mutation is required.

Narrow with [FileTree.isMutableFileItem](../functions/isMutableFileItem.md) to access mutation methods.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TCT` *extends* `string` | `string` |
