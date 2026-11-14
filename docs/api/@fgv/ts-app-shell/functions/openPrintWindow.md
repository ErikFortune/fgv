[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / openPrintWindow

# Function: openPrintWindow()

> **openPrintWindow**(`content`, `options`): `Window` \| `null`

Opens a popup window and renders the given React content inside a
[PrintEnclosure](PrintEnclosure.md) with Print and Close toolbar buttons.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `content` | `ReactElement` |
| `options` | [`IPrintWindowOptions`](../interfaces/IPrintWindowOptions.md) |

## Returns

`Window` \| `null`

## Remarks

Must be called synchronously from a user click handler to avoid
popup blockers. If the popup is blocked, returns `null`.

Styles are cloned from the parent document so that Tailwind and other
CSS frameworks work in the popup. An independent React root is created
in the popup (not a portal) so the popup is fully self-contained.
