[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / MobileCascadeStack

# Function: MobileCascadeStack()

> **MobileCascadeStack**(`props`): `ReactElement`\<`unknown`, `string` \| `JSXElementConstructor`\<`any`\>\> \| `null`

Mobile replacement for [CascadeContainer](CascadeContainer.md).

Shows the rightmost (deepest) cascade column full-screen with a back button
that pops one level at a time. At the first column, back returns to the list
by calling `onPopTo(0)`.

Accepts the same props as [CascadeContainer](CascadeContainer.md) so `CascadeContainer` can
delegate to it transparently on mobile.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`ICascadeContainerProps`](../interfaces/ICascadeContainerProps.md) |

## Returns

`ReactElement`\<`unknown`, `string` \| `JSXElementConstructor`\<`any`\>\> \| `null`
