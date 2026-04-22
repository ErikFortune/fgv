[Home](../../README.md) > [ConfigurationTools](../README.md) > IConfigurationViewProps

# Interface: IConfigurationViewProps

Props for the ConfigurationView component.
Handles editing and managing system configuration including qualifiers, qualifier types, and resource types.

**Extends:** [`IViewBaseProps`](../../interfaces/IViewBaseProps.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[configuration](./IConfigurationViewProps.configuration.md)

</td><td>



</td><td>

ISystemConfiguration | null

</td><td>

Current system configuration to display and edit

</td></tr>
<tr><td>

[onConfigurationChange](./IConfigurationViewProps.onConfigurationChange.md)

</td><td>



</td><td>

(config: ISystemConfiguration) =&gt; void

</td><td>

Callback when configuration changes (during editing)

</td></tr>
<tr><td>

[onSave](./IConfigurationViewProps.onSave.md)

</td><td>



</td><td>

(config: ISystemConfiguration) =&gt; void

</td><td>

Callback when configuration should be saved/applied

</td></tr>
<tr><td>

[hasUnsavedChanges](./IConfigurationViewProps.hasUnsavedChanges.md)

</td><td>



</td><td>

boolean

</td><td>

Whether there are unsaved changes to the configuration

</td></tr>
<tr><td>

[className](./IViewBaseProps.className.md)

</td><td>



</td><td>

string

</td><td>

Additional CSS class names for styling

</td></tr>
<tr><td>

[pickerOptionsPanelPresentation](./IViewBaseProps.pickerOptionsPanelPresentation.md)

</td><td>



</td><td>

"inline" | "hidden" | "popover" | "popup" | "collapsible"

</td><td>

How to present the ResourcePicker options control panel (default: 'hidden' for production use)

</td></tr>
</tbody></table>
