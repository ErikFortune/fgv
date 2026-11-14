[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / taskStorageFormatVersion

# Variable: taskStorageFormatVersion

> `const` **taskStorageFormatVersion**: `1` = `1`

The storage format version every record this release writes carries.

## Remarks

Versioned independently of the envelope's `schemaVersion`, a kind's `detailVersion` and a
source reference's `referenceVersion`. A record carrying any other value is never
rewritten by this release: it is reported, and its bytes are left exactly as found.
