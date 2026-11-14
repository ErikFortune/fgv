[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras](../../../README.md) / [CryptoUtils](../README.md) / IIdbPrivateKeyStorageCreateParams

# Interface: IIdbPrivateKeyStorageCreateParams

Parameters for [CryptoUtils.IdbPrivateKeyStorage.create](../classes/IdbPrivateKeyStorage.md#create).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-databasename"></a> `databaseName?` | `readonly` | `string` | IndexedDB database name. Default: `'fgv-keystore-private-keys'`. |
| <a id="property-indexeddb"></a> `indexedDB?` | `readonly` | `IDBFactory` | IndexedDB factory to use. Defaults to `globalThis.indexedDB`. Supplied explicitly in tests (e.g. a `fake-indexeddb` factory) or to target a non-default factory. |
| <a id="property-storename"></a> `storeName?` | `readonly` | `string` | IndexedDB object-store name. Default: `'privateKeys'`. |
