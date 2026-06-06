[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Runtime](../../../README.md) / [Context](../README.md) / IReadOnlyContextQualifierProviderValidator

# Interface: IReadOnlyContextQualifierProviderValidator\<T\>

A read-only interface for validators wrapping read-only context qualifier providers.
Only exposes read operations, providing compile-time type safety by excluding mutation methods.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` *extends* [`IReadOnlyContextQualifierProvider`](IReadOnlyContextQualifierProvider.md) | [`IReadOnlyContextQualifierProvider`](IReadOnlyContextQualifierProvider.md) |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="provider"></a> `provider` | `readonly` | `T` | The wrapped read-only context qualifier provider. |
