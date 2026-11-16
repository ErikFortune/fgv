[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / ISkippedCopyFile

# Interface: ISkippedCopyFile

A file a copy left behind under
[\`onUnfaithfulFile: 'skip'\`](../type-aliases/CopyUnfaithfulFileBehavior.md).

## Remarks

There is exactly one condition that produces one of these: the destination store
persists text and the file's bytes do not survive a UTF-8 round trip. Every other way a
copy can go wrong — an unreadable source, a store that cannot produce bytes at all, a
write that fails — is a `Failure`, because none of those describe one file the caller
might reasonably choose to do without.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-destinationpath"></a> `destinationPath` | `readonly` | `string` | Path the file would have occupied in the destination. **Remarks** Composed for diagnosis by joining the destination directory's path with the file's name, so it is not guaranteed to be in the backing store's native separator form. Nothing reads it back — no file was written. |
| <a id="property-message"></a> `message` | `readonly` | `string` | A message naming both paths, identical to the one a `fail` would have reported. |
| <a id="property-sourcepath"></a> `sourcePath` | `readonly` | `string` | Absolute path of the source file. |
