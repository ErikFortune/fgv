[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IDetailHeaderProps

# Interface: IDetailHeaderProps

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="actions"></a> `actions?` | `readonly` | `ReactNode` | Right slot of the status bar — action buttons |
| <a id="description"></a> `description?` | `readonly` | `string` | Optional description rendered below the status bar |
| <a id="indicators"></a> `indicators?` | `readonly` | `ReactNode` | Left slot of the status bar — badges, icons, etc. |
| <a id="onclose"></a> `onClose?` | `readonly` | () => `void` | If provided, renders a close button in the upper-right corner, inline with the title |
| <a id="subtitle"></a> `subtitle?` | `readonly` | `string` | Optional de-emphasized subtitle (e.g. entity ID) rendered below the title |
| <a id="title"></a> `title` | `readonly` | `string` | Primary entity name — rendered full-width on its own line |
