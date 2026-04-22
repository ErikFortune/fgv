[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / PrintEnclosure

# Function: PrintEnclosure()

> **PrintEnclosure**(`__namedParameters`): `Element`

A container component rendered inside a popup window that provides a
toolbar with Print and Close buttons and renders children as the
printable content.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters` | [`IPrintEnclosureProps`](../interfaces/IPrintEnclosureProps.md) |

## Returns

`Element`

## Remarks

The toolbar is hidden when printing via CSS (`print-toolbar` class).
Children are rendered at full width with no scroll constraints so
multi-page content flows naturally to the printer.
