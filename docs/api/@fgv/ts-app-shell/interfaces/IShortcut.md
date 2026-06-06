[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IShortcut

# Interface: IShortcut

A registered keyboard shortcut.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="binding"></a> `binding` | `readonly` | [`IKeyBinding`](IKeyBinding.md) | The key binding |
| <a id="description"></a> `description` | `readonly` | `string` | Human-readable description (for command palette / help) |
| <a id="handler"></a> `handler` | `readonly` | () => `boolean` \| `void` | Handler function. Return true to indicate the event was handled. |
| <a id="priority"></a> `priority?` | `readonly` | `number` | Priority (higher wins when multiple shortcuts match). Default: 0 |
