[Home](../../README.md) > [ResolutionTools](../README.md) > IResolutionContextOptionsControlProps

# Interface: IResolutionContextOptionsControlProps

Props for the ResolutionContextOptionsControl component.

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

[options](./IResolutionContextOptionsControlProps.options.md)

</td><td>



</td><td>

[IResolutionContextOptions](../../interfaces/IResolutionContextOptions.md)

</td><td>

Current context options

</td></tr>
<tr><td>

[onOptionsChange](./IResolutionContextOptionsControlProps.onOptionsChange.md)

</td><td>



</td><td>

(options: [IResolutionContextOptions](../../interfaces/IResolutionContextOptions.md)) =&gt; void

</td><td>

Callback when options change

</td></tr>
<tr><td>

[availableQualifiers](./IResolutionContextOptionsControlProps.availableQualifiers.md)

</td><td>



</td><td>

string[]

</td><td>

Available qualifiers for configuration

</td></tr>
<tr><td>

[presentation](./IResolutionContextOptionsControlProps.presentation.md)

</td><td>



</td><td>

"inline" | "hidden" | "popover" | "popup" | "collapsible"

</td><td>

How to present the options control (default: 'hidden' for production use)

</td></tr>
<tr><td>

[className](./IResolutionContextOptionsControlProps.className.md)

</td><td>



</td><td>

string

</td><td>

Custom class name

</td></tr>
<tr><td>

[title](./IResolutionContextOptionsControlProps.title.md)

</td><td>



</td><td>

string

</td><td>

Title for the control section

</td></tr>
<tr><td>

[allowResourceCreation](./IResolutionContextOptionsControlProps.allowResourceCreation.md)

</td><td>



</td><td>

boolean

</td><td>

Editing/creation toggle - when provided, show UI to control it

</td></tr>
<tr><td>

[onAllowResourceCreationChange](./IResolutionContextOptionsControlProps.onAllowResourceCreationChange.md)

</td><td>



</td><td>

(allow: boolean) =&gt; void

</td><td>

Callback for editing/creation toggle

</td></tr>
<tr><td>

[showPendingResourcesInList](./IResolutionContextOptionsControlProps.showPendingResourcesInList.md)

</td><td>



</td><td>

boolean

</td><td>

Pending resources list visibility - when provided, show UI to control it

</td></tr>
<tr><td>

[onShowPendingResourcesInListChange](./IResolutionContextOptionsControlProps.onShowPendingResourcesInListChange.md)

</td><td>



</td><td>

(show: boolean) =&gt; void

</td><td>

Callback for pending resources list visibility

</td></tr>
</tbody></table>
