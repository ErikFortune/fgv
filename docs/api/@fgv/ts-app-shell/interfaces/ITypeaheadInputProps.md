[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ITypeaheadInputProps

# Interface: ITypeaheadInputProps\<TId\>

Props for the TypeaheadInput component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="autofocus"></a> `autoFocus?` | `readonly` | `boolean` | If true, the input is focused on mount. |
| <a id="classname"></a> `className?` | `readonly` | `string` | Additional CSS class for the input element. |
| <a id="disabled"></a> `disabled?` | `readonly` | `boolean` | If true, the input is disabled. |
| <a id="maxheight"></a> `maxHeight?` | `readonly` | `number` | Maximum dropdown height in pixels. Default: 240. |
| <a id="onchange"></a> `onChange` | `readonly` | (`value`) => `void` | Called on every keystroke. |
| <a id="onselect"></a> `onSelect` | `readonly` | (`suggestion`) => `void` | Called when a suggestion is definitively selected (click, Enter, blur auto-resolve). |
| <a id="onunresolved"></a> `onUnresolved?` | `readonly` | (`text`) => `void` | Called on blur/Enter/Tab when input cannot be resolved to a single suggestion. |
| <a id="placeholder"></a> `placeholder?` | `readonly` | `string` | Placeholder text for the input. |
| <a id="prioritysuggestions"></a> `prioritySuggestions?` | `readonly` | readonly [`ITypeaheadSuggestion`](ITypeaheadSuggestion.md)\<`TId`\>[] | Optional priority suggestions shown first (e.g. recipe alternates). |
| <a id="suggestions"></a> `suggestions` | `readonly` | readonly [`ITypeaheadSuggestion`](ITypeaheadSuggestion.md)\<`TId`\>[] | Full catalog of suggestions (lower priority). |
| <a id="value"></a> `value` | `readonly` | `string` | Current text value (controlled). |
