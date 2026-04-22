[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / DetailHeader

# Function: DetailHeader()

> **DetailHeader**(`__namedParameters`): `ReactElement`

Three-line entity detail header.

Line 1: full-width `title` (bold headline)
Line 2: optional `subtitle` (de-emphasized, monospace — e.g. entity ID)
Line 3: `indicators` left-justified, `actions` right-justified (status bar)
Below: optional `description`

Both `indicators` and `actions` are `React.ReactNode` — callers own the content.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters` | [`IDetailHeaderProps`](../interfaces/IDetailHeaderProps.md) |

## Returns

`ReactElement`
