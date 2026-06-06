[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / IMultiActionButtonProps

# Interface: IMultiActionButtonProps

Props for MultiActionButton component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="alternativeactions"></a> `alternativeActions` | `readonly` | readonly [`IMultiActionButtonAction`](IMultiActionButtonAction.md)[] | Alternative actions shown in the dropdown menu. |
| <a id="classname"></a> `className?` | `readonly` | `string` | Optional CSS class name. |
| <a id="disabled"></a> `disabled?` | `readonly` | `boolean` | If true, the primary action button is disabled. |
| <a id="dropdowndisabled"></a> `dropdownDisabled?` | `readonly` | `boolean` | If true, the dropdown toggle is disabled. Defaults to `disabled`. |
| <a id="primaryaction"></a> `primaryAction` | `readonly` | [`IMultiActionButtonAction`](IMultiActionButtonAction.md) | Primary action that appears on the main button. |
| <a id="variant"></a> `variant?` | `readonly` | `"default"` \| `"danger"` \| `"primary"` | Optional variant for button styling. |
