[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / IResourcePickerOptionsControlProps

# Interface: IResourcePickerOptionsControlProps

Props for the ResourcePickerOptionsControl component.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Custom class name |
| <a id="onoptionschange"></a> `onOptionsChange` | (`options`) => `void` | Callback when options change |
| <a id="options"></a> `options` | [`IResourcePickerOptions`](IResourcePickerOptions.md) | Current picker options |
| <a id="presentation"></a> `presentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the options control (default: 'hidden' for production use) |
| <a id="quickbranchpaths"></a> `quickBranchPaths?` | `string`[] | Available quick branch paths for selection |
| <a id="showadvanced"></a> `showAdvanced?` | `boolean` | Whether to show advanced options like branch isolation |
| <a id="title"></a> `title?` | `string` | Title for the control section |
