[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / assertPortableFilenameStem

# Function: assertPortableFilenameStem()

> **assertPortableFilenameStem**(`stem`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Validates a single filename stem against the POSIX portable filename set
(`[A-Za-z0-9._-]`), rejecting a leading or trailing `.` and reserved Windows
device names. This is the cross-platform filename-stem contract for the
package: [MemoryId](../type-aliases/MemoryId.md) values, the concrete [IIdentityCodec](../interfaces/IIdentityCodec.md)
implementations, and the store's load-time identity check all gate on it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `stem` | `string` |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

## Remarks

A trailing `.` is rejected because Windows silently strips trailing dots from
filenames, so such a stem would not round-trip verbatim through the file
layer even though it is otherwise portable-set-valid.
