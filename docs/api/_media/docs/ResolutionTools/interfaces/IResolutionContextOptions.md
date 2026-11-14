[Home](../../README.md) > [ResolutionTools](../README.md) > IResolutionContextOptions

# Interface: IResolutionContextOptions

Configuration options for the resolution context controls in ResolutionView.

Controls the visibility and behavior of the context configuration panel,
allowing hosts to customize which qualifiers are editable and provide
externally managed context values. Uses QualifierControlOptions for
per-qualifier customization.

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

[showContextControls](./IResolutionContextOptions.showContextControls.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to show the context configuration panel at all

</td></tr>
<tr><td>

[showCurrentContext](./IResolutionContextOptions.showCurrentContext.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to show the current context display

</td></tr>
<tr><td>

[showContextActions](./IResolutionContextOptions.showContextActions.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to show the Apply/Reset buttons

</td></tr>
<tr><td>

[qualifierOptions](./IResolutionContextOptions.qualifierOptions.md)

</td><td>



</td><td>

Record&lt;string, [IQualifierControlOptions](../../interfaces/IQualifierControlOptions.md)&gt;

</td><td>

Per-qualifier control options

</td></tr>
<tr><td>

[defaultQualifierEditable](./IResolutionContextOptions.defaultQualifierEditable.md)

</td><td>



</td><td>

boolean

</td><td>

Global defaults for qualifiers not specifically configured

</td></tr>
<tr><td>

[defaultQualifierVisible](./IResolutionContextOptions.defaultQualifierVisible.md)

</td><td>



</td><td>

boolean

</td><td>



</td></tr>
<tr><td>

[hostManagedValues](./IResolutionContextOptions.hostManagedValues.md)

</td><td>



</td><td>

Record&lt;string, string | undefined&gt;

</td><td>

Host-managed values that override all user input for invisible qualifiers

</td></tr>
<tr><td>

[contextPanelTitle](./IResolutionContextOptions.contextPanelTitle.md)

</td><td>



</td><td>

string

</td><td>

Custom title for the context configuration panel

</td></tr>
<tr><td>

[globalPlaceholder](./IResolutionContextOptions.globalPlaceholder.md)

</td><td>



</td><td>

string | ((qualifierName: string) =&gt; string)

</td><td>

Global placeholder text pattern for qualifier inputs

</td></tr>
<tr><td>

[contextPanelClassName](./IResolutionContextOptions.contextPanelClassName.md)

</td><td>



</td><td>

string

</td><td>

Additional CSS classes for the context panel

</td></tr>
</tbody></table>
