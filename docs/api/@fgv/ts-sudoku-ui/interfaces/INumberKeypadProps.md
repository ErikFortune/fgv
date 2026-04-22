[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-sudoku-ui](../README.md) / INumberKeypadProps

# Interface: INumberKeypadProps

Props for the NumberKeypad component

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `readonly` | `string` | Additional CSS class name |
| <a id="compact"></a> `compact?` | `readonly` | `boolean` | Compact mode for smaller screens |
| <a id="disabled"></a> `disabled?` | `readonly` | `boolean` | Whether the keypad is disabled |
| <a id="inputmode"></a> `inputMode` | `readonly` | `InputMode` | Current input mode |
| <a id="isactive"></a> `isActive` | `readonly` | `boolean` | Whether this keypad is currently active |
| <a id="keypadtype"></a> `keypadType` | `readonly` | `"values"` \| `"notes"` | Type of keypad - affects styling and behavior |
| <a id="onclear"></a> `onClear` | `readonly` | () => `void` | Callback when clear is pressed |
| <a id="onnumberpress"></a> `onNumberPress` | `readonly` | (`number`) => `void` | Callback when a number is pressed |
