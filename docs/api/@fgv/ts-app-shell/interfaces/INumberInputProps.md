[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / INumberInputProps

# Interface: INumberInputProps

Props for the NumberInput component.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="label"></a> `label` | `readonly` | `string` | Accessible label for the input |
| <a id="max"></a> `max?` | `readonly` | `number` | Maximum allowed value |
| <a id="min"></a> `min?` | `readonly` | `number` | Minimum allowed value |
| <a id="onchange"></a> `onChange` | `readonly` | (`value`) => `void` | Called when value changes (empty input → undefined) |
| <a id="step"></a> `step?` | `readonly` | `number` | Step increment |
| <a id="value"></a> `value` | `readonly` | `number` \| `undefined` | Current value (undefined means empty) |
