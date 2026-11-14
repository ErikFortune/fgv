[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-json-base](../../../README.md) / [FileTree](../README.md) / CopyUnfaithfulFileBehavior

# Type Alias: CopyUnfaithfulFileBehavior

> **CopyUnfaithfulFileBehavior** = `"fail"` \| `"skip"`

What a copy does with a file it cannot carry byte-faithfully.

## Remarks

- `fail`: the copy fails, naming the offending path. **The default.**
- `skip`: the file is left out and reported on
  [ICopyReport.skipped](../interfaces/ICopyReport.md#property-skipped).

The default is `fail` for the same reason
[getFileTextStrict](../interfaces/IStrictTextFileTreeAccessors.md#getfiletextstrict)
refuses rather than substituting: a copy that quietly drops or mangles a file is
discovered later, when the source may be gone. Choosing `skip` should be a deliberate
act, because a file that cannot be carried is often a file that should not have been in
the set, and a failure that names it is the diagnosis.
