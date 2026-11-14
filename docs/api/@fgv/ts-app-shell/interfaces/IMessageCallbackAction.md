[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IMessageCallbackAction

# Interface: IMessageCallbackAction

An actionable element attached to a message rendered as a callback button.
Renderers display this as a `<button>` that invokes [IMessageCallbackAction.onAction](#property-onaction).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-href"></a> `href?` | `readonly` | `undefined` | - |
| <a id="property-label"></a> `label` | `readonly` | `string` | Action label |
| <a id="property-onaction"></a> `onAction` | `readonly` | () => `void` | Callback when the action is triggered. |
