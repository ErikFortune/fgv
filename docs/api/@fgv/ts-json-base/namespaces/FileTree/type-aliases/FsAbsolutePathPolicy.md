[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / FsAbsolutePathPolicy

# Type Alias: FsAbsolutePathPolicy

> **FsAbsolutePathPolicy** = [`StringOneOf`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<*typeof* [`allFsAbsolutePathPolicies`](../variables/allFsAbsolutePathPolicies.md)\>

How [FsFileTreeAccessors](../classes/FsFileTreeAccessors.md) treats a path
that resolves outside its `prefix`.

## Remarks

- `'unconfined'` (the default): an absolute input is used as given, and a
  relative input is resolved against the prefix; nothing checks that the
  result lies under the prefix. Only the atomic-write methods confine.
- `'confined'`: every operation lands under the prefix. A resolved path that
  is not under it is mapped beneath it — see
  [resolveAbsolutePath](../classes/FsFileTreeAccessors.md#resolveabsolutepath).
- `'verified'`: an operation whose resolved path is not under the prefix fails,
  naming the path and the prefix, and touches nothing.
