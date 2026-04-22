[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / IResourceAnnotations

# Interface: IResourceAnnotations

Annotations that can be displayed next to resource names in the picker.

This allows the host application to provide visual indicators for resources,
such as candidate counts, editing status, or validation states.

## Example

```tsx
const annotations: IResourceAnnotations = {
  'user.welcome': {
    badge: { text: '3', variant: 'info' },
    suffix: '(3 candidates)'
  },
  'user.modified': {
    badge: { text: 'M', variant: 'edited' },
    indicator: { type: 'dot', value: 'orange', tooltip: 'Modified' }
  }
};
```

## Indexable

\[`resourceId`: `string`\]: [`IResourceAnnotation`](IResourceAnnotation.md)

Map of resource IDs to their annotation configurations
