[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / IMemoryStoreListFilter

# Interface: IMemoryStoreListFilter

Filter for [IMemoryStore.list](IMemoryStore.md#list). All present fields are ANDed together.

## Remarks

**At least one of `scope` / `kind` / `tag` must be present.** `asOf` is a
temporal *projection*, not a narrowing — it collapses versions rather than
excluding entities — so it does not satisfy the requirement on its own. A
selection that narrows nothing fails with a message naming
[scanEveryRecord](../functions/scanEveryRecord.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-asof"></a> `asOf?` | `readonly` | `number` | For temporal (versioned) kinds: collapse each entity to the single version valid at this epoch ms. Non-temporal records are timeless and pass through unchanged. Absent = no temporal projection (every version is returned). |
| <a id="property-kind"></a> `kind?` | `readonly` | [`Kind`](../type-aliases/Kind.md) | Restrict to records of this kind. |
| <a id="property-scaneveryrecord"></a> `scanEveryRecord?` | `readonly` | `undefined` | Never present on a narrowing filter. **Remarks** Exclusivity marker, paired with the `never`s on [IWholeVaultScan](IWholeVaultScan.md). Without it `{ scanEveryRecord: true, kind }` type-checks — TypeScript's excess-property check on a union admits any property declared by *any* member — and `list` then takes the scan branch and silently discards the narrowing. Since the whole point of requiring a selection is that a whole-vault read must be deliberate, a call that reads the whole vault while *looking* narrowed is the one outcome this surface must not permit. |
| <a id="property-scope"></a> `scope?` | `readonly` | [`MemoryScopeKey`](../type-aliases/MemoryScopeKey.md) | Restrict to records in this scope. |
| <a id="property-tag"></a> `tag?` | `readonly` | [`Tag`](../type-aliases/Tag.md) | Restrict to records carrying this tag (exact match). |
