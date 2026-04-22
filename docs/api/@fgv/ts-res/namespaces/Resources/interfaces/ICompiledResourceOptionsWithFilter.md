[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / ICompiledResourceOptionsWithFilter

# Interface: ICompiledResourceOptionsWithFilter

Extended compiled resource options that includes context filtering capabilities.
This interface combines the standard compilation options with strongly-typed
context filtering for resource candidates.

## Extends

- [`ICompiledResourceOptions`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceOptions.md)

## Properties

| Property | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| <a id="filterforcontext"></a> `filterForContext?` | [`IValidatedContextDecl`](../../Context/type-aliases/IValidatedContextDecl.md) | `undefined` | If provided, filters resource candidates to only include those that can match the specified validated context. This provides strongly-typed context filtering. Use resourceManager.validateContext() to create a validated context from an IContextDecl. |
| <a id="includemetadata"></a> `includeMetadata?` | `boolean` | `false` | Whether to include metadata in the compiled objects. Metadata includes human-readable information like semantic keys that can be useful for debugging or tooling. |
