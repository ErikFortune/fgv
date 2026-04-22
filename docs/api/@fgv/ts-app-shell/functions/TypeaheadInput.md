[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-app-shell](../README.md) / TypeaheadInput

# Function: TypeaheadInput()

> **TypeaheadInput**\<`TId`\>(`props`): `ReactElement`

Text input with a custom autocomplete dropdown supporting tiered suggestions.

Priority suggestions (e.g. recipe alternates) appear first, visually separated
from the full catalog. On blur, applies resolution logic: exact match → auto-select,
single partial match → auto-select, else fires `onUnresolved`.

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TId` *extends* `string` | `string` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`ITypeaheadInputProps`](../interfaces/ITypeaheadInputProps.md)\<`TId`\> |

## Returns

`ReactElement`
