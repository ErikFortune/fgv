[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / INumericInputProps

# Interface: INumericInputProps

Props for the [NumericInput](../functions/NumericInput.md) component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="autofocus"></a> `autoFocus?` | `readonly` | `boolean` | Auto-focus the input on mount. |
| <a id="classname"></a> `className?` | `readonly` | `string` | Additional or replacement CSS classes. |
| <a id="disabled"></a> `disabled?` | `readonly` | `boolean` | Disabled state. |
| <a id="label"></a> `label?` | `readonly` | `string` | Accessible label (maps to `aria-label`). |
| <a id="max"></a> `max?` | `readonly` | `number` | Maximum allowed value (clamped on blur). |
| <a id="min"></a> `min?` | `readonly` | `number` | Minimum allowed value (clamped on blur). |
| <a id="onchange"></a> `onChange` | `readonly` | (`value`) => `void` | Called with the parsed number on blur, or `undefined` if the field is empty. |
| <a id="placeholder"></a> `placeholder?` | `readonly` | `string` | Placeholder text shown when the field is empty. |
| <a id="step"></a> `step?` | `readonly` | `number` | Step for arrow-key increment/decrement. Defaults to 1. |
| <a id="value"></a> `value` | `readonly` | `number` \| `undefined` | Current numeric value (`undefined` = empty field). |
