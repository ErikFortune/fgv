[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IDetailHeaderProps

# Interface: IDetailHeaderProps

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-actions"></a> `actions?` | `readonly` | `ReactNode` | Right slot of the status bar — action buttons |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional description rendered below the status bar |
| <a id="property-indicators"></a> `indicators?` | `readonly` | `ReactNode` | Left slot of the status bar — badges, icons, etc. |
| <a id="property-onclose"></a> `onClose?` | `readonly` | () => `void` | If provided, renders a close button in the upper-right corner, inline with the title |
| <a id="property-subtitle"></a> `subtitle?` | `readonly` | `string` | Optional de-emphasized subtitle (e.g. entity ID) rendered below the title |
| <a id="property-title"></a> `title` | `readonly` | `string` | Primary entity name — rendered full-width on its own line |
