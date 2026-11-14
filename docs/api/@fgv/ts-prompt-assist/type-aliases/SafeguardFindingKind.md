[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / SafeguardFindingKind

# Type Alias: SafeguardFindingKind

> **SafeguardFindingKind** = [`BuiltInFindingKind`](BuiltInFindingKind.md) \| `string` & `object`

Discriminator of a safeguard finding kind. Built-in kinds (see
[BuiltInFindingKind](BuiltInFindingKind.md)) preserve autocomplete; the `string & {}` branch
lets custom [IScreener](../interfaces/IScreener.md) implementations emit arbitrary kinds.
