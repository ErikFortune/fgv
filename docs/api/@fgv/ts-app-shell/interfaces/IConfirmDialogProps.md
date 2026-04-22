[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IConfirmDialogProps

# Interface: IConfirmDialogProps

Props for the ConfirmDialog component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="cancellabel"></a> `cancelLabel?` | `readonly` | `string` | Label for the cancel button (defaults to 'Cancel') |
| <a id="confirmlabel"></a> `confirmLabel?` | `readonly` | `string` | Label for the confirm button (defaults to 'Confirm') |
| <a id="isopen"></a> `isOpen` | `readonly` | `boolean` | Whether the dialog is open |
| <a id="message"></a> `message` | `readonly` | `ReactNode` | Dialog message body |
| <a id="oncancel"></a> `onCancel` | `readonly` | () => `void` | Called when the user cancels or closes |
| <a id="onconfirm"></a> `onConfirm` | `readonly` | () => `void` | Called when the user confirms |
| <a id="severity"></a> `severity?` | `readonly` | [`ConfirmDialogSeverity`](../type-aliases/ConfirmDialogSeverity.md) | Severity level controlling confirm button color (defaults to 'danger') |
| <a id="title"></a> `title` | `readonly` | `string` | Dialog title |
