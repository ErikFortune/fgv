[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IWholeVaultScan

# Interface: IWholeVaultScan

The named, deliberately uncomfortable opt-out from
[IMemoryStore.list](IMemoryStore.md#list)'s narrowing requirement — build one with
[scanEveryRecord](../functions/scanEveryRecord.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `number` | Optional temporal projection, exactly as on [IMemoryStoreListFilter](IMemoryStoreListFilter.md). NOT excluded, because `asOf` projects rather than narrows and composes with a whole-vault read exactly as it does with a filtered one. |
| <a id="property-kind"></a> `kind?` | `readonly` | `undefined` | Never present on a whole-vault scan. See [IWholeVaultScan.scope](#property-scope). |
| <a id="property-scaneveryrecord"></a> `scanEveryRecord` | `readonly` | `true` | Discriminator. Always `true`; produced only by [scanEveryRecord](../functions/scanEveryRecord.md). |
| <a id="property-scope"></a> `scope?` | `readonly` | `undefined` | Never present on a whole-vault scan — see [IMemoryStoreListFilter.scanEveryRecord](IMemoryStoreListFilter.md#property-scaneveryrecord) for why these markers exist. A scan that also carried a narrowing axis would have that axis dropped. |
| <a id="property-tag"></a> `tag?` | `readonly` | `undefined` | Never present on a whole-vault scan. See [IWholeVaultScan.scope](#property-scope). |
