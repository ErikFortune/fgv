[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / ITypeaheadInputProps

# Interface: ITypeaheadInputProps\<TId\>

Props for the TypeaheadInput component.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tid"></a> `TId` *extends* `string` | `string` |

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-autofocus"></a> `autoFocus?` | `readonly` | `boolean` | If true, the input is focused on mount. |
| <a id="property-classname"></a> `className?` | `readonly` | `string` | Additional CSS class for the input element. |
| <a id="property-disabled"></a> `disabled?` | `readonly` | `boolean` | If true, the input is disabled. |
| <a id="property-maxheight"></a> `maxHeight?` | `readonly` | `number` | Maximum dropdown height in pixels. Default: 240. |
| <a id="property-onchange"></a> `onChange` | `readonly` | (`value`) => `void` | Called on every keystroke. |
| <a id="property-onselect"></a> `onSelect` | `readonly` | (`suggestion`) => `void` | Called when a suggestion is definitively selected (click, Enter, blur auto-resolve). |
| <a id="property-onunresolved"></a> `onUnresolved?` | `readonly` | (`text`) => `void` | Called on blur/Enter/Tab when input cannot be resolved to a single suggestion. |
| <a id="property-placeholder"></a> `placeholder?` | `readonly` | `string` | Placeholder text for the input. |
| <a id="property-prioritysuggestions"></a> `prioritySuggestions?` | `readonly` | readonly [`ITypeaheadSuggestion`](ITypeaheadSuggestion.md)\<`TId`\>[] | Optional priority suggestions shown first (e.g. recipe alternates). |
| <a id="property-suggestions"></a> `suggestions` | `readonly` | readonly [`ITypeaheadSuggestion`](ITypeaheadSuggestion.md)\<`TId`\>[] | Full catalog of suggestions (lower priority). |
| <a id="property-value"></a> `value` | `readonly` | `string` | Current text value (controlled). |
