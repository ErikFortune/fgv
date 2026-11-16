[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IResponsiveLayout

# Interface: IResponsiveLayout

Responsive layout information exposed by the hook and context.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-devicetype"></a> `deviceType` | `readonly` | [`DeviceType`](../type-aliases/DeviceType.md) | Device type based on screen size and touch capability |
| <a id="property-istouchdevice"></a> `isTouchDevice` | `readonly` | `boolean` | Whether the device supports touch input |
| <a id="property-layoutmode"></a> `layoutMode` | `readonly` | [`LayoutMode`](../type-aliases/LayoutMode.md) | Structural layout mode driving component tree decisions |
| <a id="property-orientation"></a> `orientation` | `readonly` | [`ScreenOrientation`](../type-aliases/ScreenOrientation.md) | Current screen orientation |
| <a id="property-screenheight"></a> `screenHeight` | `readonly` | `number` | Viewport height in pixels |
| <a id="property-screenwidth"></a> `screenWidth` | `readonly` | `number` | Viewport width in pixels |
