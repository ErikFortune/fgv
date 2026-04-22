[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IQualifierControlOptions

# Interface: IQualifierControlOptions

Options for controlling individual qualifier context controls.

Provides fine-grained control over the behavior, appearance, and editability
of individual qualifier inputs. This allows hosts to customize which qualifiers
are editable, provide external values, and control the presentation.

## Example

```tsx
// Make a qualifier readonly with external value
const languageOptions: IQualifierControlOptions = {
  visible: true,
  editable: false,
  hostValue: 'en-US',
  showHostValue: true,
  placeholder: 'Language managed externally'
};
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Custom CSS classes for this qualifier control |
| <a id="editable"></a> `editable?` | `boolean` | Whether this qualifier is editable by the user |
| <a id="hostvalue"></a> `hostValue?` | `string` | External/host-managed value that overrides user input |
| <a id="placeholder"></a> `placeholder?` | `string` | Custom placeholder text for this qualifier |
| <a id="showhostvalue"></a> `showHostValue?` | `boolean` | Whether to show host-managed values in the display |
| <a id="visible"></a> `visible?` | `boolean` | Whether this qualifier should be visible at all |
