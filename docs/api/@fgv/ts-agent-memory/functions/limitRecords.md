[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-memory](../README.md) / limitRecords

# Function: limitRecords()

> **limitRecords**(`records`, `limit?`, `offset?`): readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]

Apply the `{ offset, limit }` page window to an ordered record set. Applied
last, after ordering, so it always takes a stable window of the ordered
result. `offset` is applied first (records to skip), then `limit` (top-N of
the remainder).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `records` | readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[] |
| `limit?` | `number` |
| `offset?` | `number` |

## Returns

readonly [`IMemoryRecord`](../interfaces/IMemoryRecord.md)\<`unknown`\>[]

## Remarks

Both bounds are public query input and are guarded against non-positive
values slipping into `slice`:
- `offset` absent or non-positive → no skip (today's behavior). An offset past
  the end yields an empty page rather than a throw.
- `limit` absent → no truncation; a non-positive `limit` means "no records"
  and returns an empty array.
