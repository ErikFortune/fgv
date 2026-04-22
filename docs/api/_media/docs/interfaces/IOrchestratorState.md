[Home](../README.md) > IOrchestratorState

# Interface: IOrchestratorState

Complete state object for the resource orchestrator system.

This interface represents the central state management for ts-res resources, encompassing
all aspects of resource processing, configuration, filtering, and resolution. It serves as
the primary state container for applications using the resource orchestrator.

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

[resources](./IOrchestratorState.resources.md)

</td><td>



</td><td>

[IExtendedProcessedResources](IExtendedProcessedResources.md) | null

</td><td>



</td></tr>
<tr><td>

[configuration](./IOrchestratorState.configuration.md)

</td><td>



</td><td>

ISystemConfiguration | null

</td><td>



</td></tr>
<tr><td>

[filterState](./IOrchestratorState.filterState.md)

</td><td>



</td><td>

[IFilterState](IFilterState.md)

</td><td>



</td></tr>
<tr><td>

[filterResult](./IOrchestratorState.filterResult.md)

</td><td>



</td><td>

[IFilterResult](IFilterResult.md) | null

</td><td>



</td></tr>
<tr><td>

[resolutionState](./IOrchestratorState.resolutionState.md)

</td><td>



</td><td>

[IResolutionState](IResolutionState.md)

</td><td>



</td></tr>
<tr><td>

[selectedResourceId](./IOrchestratorState.selectedResourceId.md)

</td><td>



</td><td>

string | null

</td><td>



</td></tr>
<tr><td>

[isProcessing](./IOrchestratorState.isProcessing.md)

</td><td>



</td><td>

boolean

</td><td>



</td></tr>
<tr><td>

[error](./IOrchestratorState.error.md)

</td><td>



</td><td>

string | null

</td><td>



</td></tr>
<tr><td>

[messages](./IOrchestratorState.messages.md)

</td><td>



</td><td>

[IMessage](IMessage.md)[]

</td><td>



</td></tr>
<tr><td>

[resourceEditorFactory](./IOrchestratorState.resourceEditorFactory.md)

</td><td>



</td><td>

[IResourceEditorFactory](IResourceEditorFactory.md)&lt;unknown, [JsonValue](../type-aliases/JsonValue.md)&gt;

</td><td>



</td></tr>
</tbody></table>
