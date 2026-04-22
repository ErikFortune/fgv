[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-http-storage](../README.md) / FsStorageProviderFactory

# Class: FsStorageProviderFactory

Namespace-aware provider factory backed by filesystem directories.

## Implements

- [`IHttpStorageProviderFactory`](../interfaces/IHttpStorageProviderFactory.md)

## Constructors

### Constructor

> **new FsStorageProviderFactory**(`options`): `FsStorageProviderFactory`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`IFsStorageProviderFactoryOptions`](../interfaces/IFsStorageProviderFactoryOptions.md) |

#### Returns

`FsStorageProviderFactory`

## Methods

### forNamespace()

> **forNamespace**(`namespace?`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md)\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `namespace?` | `string` |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IHttpStorageProvider`](../interfaces/IHttpStorageProvider.md)\>

#### Implementation of

[`IHttpStorageProviderFactory`](../interfaces/IHttpStorageProviderFactory.md).[`forNamespace`](../interfaces/IHttpStorageProviderFactory.md#fornamespace)
