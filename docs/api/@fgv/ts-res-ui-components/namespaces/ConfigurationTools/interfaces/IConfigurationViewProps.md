[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ConfigurationTools](../README.md) / IConfigurationViewProps

# Interface: IConfigurationViewProps

Props for the ConfigurationView component.
Handles editing and managing system configuration including qualifiers, qualifier types, and resource types.

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="configuration"></a> `configuration?` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| `null` | Current system configuration to display and edit |
| <a id="hasunsavedchanges"></a> `hasUnsavedChanges?` | `boolean` | Whether there are unsaved changes to the configuration |
| <a id="onconfigurationchange"></a> `onConfigurationChange?` | (`config`) => `void` | Callback when configuration changes (during editing) |
| <a id="onsave"></a> `onSave?` | (`config`) => `void` | Callback when configuration should be saved/applied |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
