[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / IResourceAnnotation

# Interface: IResourceAnnotation

Individual resource annotation configuration.

Supports multiple types of visual indicators that can be combined:
- Badge: Small colored badge with text
- Indicator: Dot, icon, or text indicator with optional tooltip
- Suffix: Additional content displayed after the resource name

## Example

```tsx
const annotation: IResourceAnnotation = {
  badge: { text: 'NEW', variant: 'new' },
  indicator: {
    type: 'icon',
    value: <CheckIcon />,
    tooltip: 'Validated'
  },
  suffix: <span className="text-gray-500">(5 candidates)</span>,
  className: 'resource-highlighted'
};
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="badge"></a> `badge?` | `object` | Small colored badge displayed next to the resource name |
| `badge.text` | `string` | Text content of the badge |
| `badge.variant` | `"error"` \| `"new"` \| `"success"` \| `"info"` \| `"warning"` \| `"edited"` | Visual style variant for the badge |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names to apply to the resource item |
| <a id="indicator"></a> `indicator?` | `object` | Visual indicator (dot, icon, or text) with optional tooltip |
| `indicator.tooltip?` | `string` | Optional tooltip text shown on hover |
| `indicator.type` | `"text"` \| `"dot"` \| `"icon"` | Type of indicator to display |
| `indicator.value` | `ReactNode` | Content of the indicator (color for dot, React element for icon, string for text) |
| <a id="suffix"></a> `suffix?` | `ReactNode` | Additional content displayed after the resource name (e.g., candidate counts) |
