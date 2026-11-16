[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptStoreFixtureDescriptor

# Type Alias: IPromptStoreFixtureDescriptor

> **IPromptStoreFixtureDescriptor** = `Omit`\<[`IPromptDescriptor`](../interfaces/IPromptDescriptor.md), `"id"`\> & `object`

Fixture-seed-only descriptor shape: `id` is optional. Per F12, on
the fixture path the outer `IPromptStoreFixtureSeedRecord.id` already
carries the prompt id, so the nested `descriptor.id` is redundant —
the fixture defaults it from the outer id when omitted. An explicit
`descriptor.id` that mismatches the outer id is rejected loudly.

The on-disk-YAML schema is unchanged: the filename stem matters
there, so `IPromptDescriptor.id` remains required on the
loader-facing descriptor type.

## Type Declaration

| Name | Type |
| ------ | ------ |
| `id?` | [`PromptId`](PromptId.md) |
