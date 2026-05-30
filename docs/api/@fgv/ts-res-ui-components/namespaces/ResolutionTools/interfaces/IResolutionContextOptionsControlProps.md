[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IResolutionContextOptionsControlProps

# Interface: IResolutionContextOptionsControlProps

Props for the ResolutionContextOptionsControl component.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allowresourcecreation"></a> `allowResourceCreation?` | `boolean` | Editing/creation toggle - when provided, show UI to control it |
| <a id="availablequalifiers"></a> `availableQualifiers?` | `string`[] | Available qualifiers for configuration |
| <a id="classname"></a> `className?` | `string` | Custom class name |
| <a id="onallowresourcecreationchange"></a> `onAllowResourceCreationChange?` | (`allow`) => `void` | Callback for editing/creation toggle |
| <a id="onoptionschange"></a> `onOptionsChange` | (`options`) => `void` | Callback when options change |
| <a id="onshowpendingresourcesinlistchange"></a> `onShowPendingResourcesInListChange?` | (`show`) => `void` | Callback for pending resources list visibility |
| <a id="options"></a> `options` | [`IResolutionContextOptions`](IResolutionContextOptions.md) | Current context options |
| <a id="presentation"></a> `presentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the options control (default: 'hidden' for production use) |
| <a id="showpendingresourcesinlist"></a> `showPendingResourcesInList?` | `boolean` | Pending resources list visibility - when provided, show UI to control it |
| <a id="title"></a> `title?` | `string` | Title for the control section |
