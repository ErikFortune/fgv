[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / scanEveryRecord

# Function: scanEveryRecord()

> **scanEveryRecord**(`options?`): [`IWholeVaultScan`](../interfaces/IWholeVaultScan.md)

Ask [IMemoryStore.list](../interfaces/IMemoryStore.md#list) for **every record in the vault**, bodies
included.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | \{ `asOf?`: `number`; \} |
| `options.asOf?` | `number` |

## Returns

[`IWholeVaultScan`](../interfaces/IWholeVaultScan.md)

## Remarks

`list` requires a selection and rejects one that narrows nothing, so this is
the only way to get the whole vault — and that is the point. Since the index
holds envelopes only, `list` materializes every survivor from storage, so an
unnarrowed call reads one file per record. Making it impossible to write by
accident is worth more than making it fast.

It is named for what it costs rather than for what it returns, and it is
greppable: `scanEveryRecord` enumerates every whole-vault read in a codebase in
one search. This mirrors `@fgv/ts-extras`' `safer-fetch`, where `addressGuard`
is required with no default and `allowAnyAddress()` is the named opt-out.

**If you only need to select, you do not need this.** Use
[IMemoryStore.listEntries](../interfaces/IMemoryStore.md#listentries), which returns every entry's scope and
envelope, reads no files, and needs no selection.
