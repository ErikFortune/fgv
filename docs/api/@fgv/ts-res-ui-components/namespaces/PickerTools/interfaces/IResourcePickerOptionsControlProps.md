[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / IResourcePickerOptionsControlProps

# Interface: IResourcePickerOptionsControlProps

Props for the ResourcePickerOptionsControl component.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-classname"></a> `className?` | `string` | Custom class name |
| <a id="property-onoptionschange"></a> `onOptionsChange` | (`options`) => `void` | Callback when options change |
| <a id="property-options"></a> `options` | [`IResourcePickerOptions`](IResourcePickerOptions.md) | Current picker options |
| <a id="property-presentation"></a> `presentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the options control (default: 'hidden' for production use) |
| <a id="property-quickbranchpaths"></a> `quickBranchPaths?` | `string`[] | Available quick branch paths for selection |
| <a id="property-showadvanced"></a> `showAdvanced?` | `boolean` | Whether to show advanced options like branch isolation |
| <a id="property-title"></a> `title?` | `string` | Title for the control section |
