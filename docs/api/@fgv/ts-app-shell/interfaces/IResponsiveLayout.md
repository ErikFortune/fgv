[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IResponsiveLayout

# Interface: IResponsiveLayout

Responsive layout information exposed by the hook and context.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="devicetype"></a> `deviceType` | `readonly` | [`DeviceType`](../type-aliases/DeviceType.md) | Device type based on screen size and touch capability |
| <a id="istouchdevice"></a> `isTouchDevice` | `readonly` | `boolean` | Whether the device supports touch input |
| <a id="layoutmode"></a> `layoutMode` | `readonly` | [`LayoutMode`](../type-aliases/LayoutMode.md) | Structural layout mode driving component tree decisions |
| <a id="orientation"></a> `orientation` | `readonly` | [`ScreenOrientation`](../type-aliases/ScreenOrientation.md) | Current screen orientation |
| <a id="screenheight"></a> `screenHeight` | `readonly` | `number` | Viewport height in pixels |
| <a id="screenwidth"></a> `screenWidth` | `readonly` | `number` | Viewport width in pixels |
