# @fgv/ts-res-ui-components

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[DownloadTools](./DownloadTools/README.md)

</td><td>



</td></tr>
<tr><td>

[FilterTools](./FilterTools/README.md)

</td><td>



</td></tr>
<tr><td>

[ResolutionTools](./ResolutionTools/README.md)

</td><td>



</td></tr>
<tr><td>

[ConfigurationTools](./ConfigurationTools/README.md)

</td><td>



</td></tr>
<tr><td>

[ResourceTools](./ResourceTools/README.md)

</td><td>



</td></tr>
<tr><td>

[ImportTools](./ImportTools/README.md)

</td><td>



</td></tr>
<tr><td>

[TsResTools](./TsResTools/README.md)

</td><td>



</td></tr>
<tr><td>

[ZipTools](./ZipTools/README.md)

</td><td>



</td></tr>
<tr><td>

[ViewStateTools](./ViewStateTools/README.md)

</td><td>



</td></tr>
<tr><td>

[PickerTools](./PickerTools/README.md)

</td><td>



</td></tr>
<tr><td>

[GridTools](./GridTools/README.md)

</td><td>



</td></tr>
<tr><td>

[ObservabilityTools](./ObservabilityTools/README.md)

</td><td>



</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[INavigationWarningState](./interfaces/INavigationWarningState.md)

</td><td>



</td></tr>
<tr><td>

[INavigationWarningActions](./interfaces/INavigationWarningActions.md)

</td><td>



</td></tr>
<tr><td>

[IOrchestratorState](./interfaces/IOrchestratorState.md)

</td><td>

Complete state object for the resource orchestrator system.

</td></tr>
<tr><td>

[IOrchestratorActions](./interfaces/IOrchestratorActions.md)

</td><td>

Complete actions interface for the resource orchestrator system.

</td></tr>
<tr><td>

[IResolutionActions](./interfaces/IResolutionActions.md)

</td><td>

Actions available for managing resource resolution testing and editing.

</td></tr>
<tr><td>

[IObservabilityProviderProps](./interfaces/IObservabilityProviderProps.md)

</td><td>

Props for the ObservabilityProvider component.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[NavigationWarningState](./type-aliases/NavigationWarningState.md)

</td><td>



</td></tr>
<tr><td>

[NavigationWarningActions](./type-aliases/NavigationWarningActions.md)

</td><td>



</td></tr>
<tr><td>

[Result](./type-aliases/Result.md)

</td><td>

Represents the IResult | result of some operation or sequence of operations.

</td></tr>
<tr><td>

[JsonValue](./type-aliases/JsonValue.md)

</td><td>

A JsonValue | JsonValue is one of: a JsonPrimitive | JsonPrimitive,

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[useNavigationWarning](./functions/useNavigationWarning.md)

</td><td>



</td></tr>
<tr><td>

[useUrlParams](./functions/useUrlParams.md)

</td><td>

Hook to parse and provide URL parameters for initial app configuration

</td></tr>
<tr><td>

[useSmartObservability](./functions/useSmartObservability.md)

</td><td>

Smart observability hook that automatically provides the best available observability context.

</td></tr>
<tr><td>

[useObservability](./functions/useObservability.md)

</td><td>

Hook to access the current observability context.

</td></tr>
<tr><td>

[AppLayout](./functions/AppLayout.md)

</td><td>

Generic app layout component with header, sidebar, main content area, and messages window

</td></tr>
<tr><td>

[AppSidebar](./functions/AppSidebar.md)

</td><td>

Generic app sidebar component with configurable tools list

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[ImportView](./variables/ImportView.md)

</td><td>

ImportView component for importing resource files, directories, and bundles.

</td></tr>
<tr><td>

[SourceView](./variables/SourceView.md)

</td><td>

SourceView component for browsing and managing source resource collections.

</td></tr>
<tr><td>

[FilterView](./variables/FilterView.md)

</td><td>

FilterView component for context-based resource filtering and analysis.

</td></tr>
<tr><td>

[CompiledView](./variables/CompiledView.md)

</td><td>

CompiledView component for browsing compiled resource collections and metadata.

</td></tr>
<tr><td>

[ResolutionView](./variables/ResolutionView.md)

</td><td>

ResolutionView component for resource resolution testing and editing.

</td></tr>
<tr><td>

[ConfigurationView](./variables/ConfigurationView.md)

</td><td>

ConfigurationView component for managing ts-res system configurations.

</td></tr>
<tr><td>

[MessagesWindow](./variables/MessagesWindow.md)

</td><td>

MessagesWindow component for displaying and managing application messages.

</td></tr>
<tr><td>

[GridView](./variables/GridView.md)

</td><td>

GridView component for displaying multiple resources in a tabular format.

</td></tr>
<tr><td>

[MultiGridView](./variables/MultiGridView.md)

</td><td>

MultiGridView component for managing multiple grid instances with shared context.

</td></tr>
<tr><td>

[ResourceOrchestrator](./variables/ResourceOrchestrator.md)

</td><td>

Main orchestrator component for ts-res resource management UI.

</td></tr>
<tr><td>

[ObservabilityProvider](./variables/ObservabilityProvider.md)

</td><td>

Provider component that makes observability context available to all child components.

</td></tr>
<tr><td>

[ResourceTreeView](./variables/ResourceTreeView.md)

</td><td>

A hierarchical tree view component for displaying and navigating resource structures.

</td></tr>
<tr><td>

[ResourceListView](./variables/ResourceListView.md)

</td><td>

A flat list view component for displaying and selecting resources.

</td></tr>
<tr><td>

[SourceResourceDetail](./variables/SourceResourceDetail.md)

</td><td>

A comprehensive component for displaying detailed information about a specific resource.

</td></tr>
<tr><td>

[ResolutionResults](./variables/ResolutionResults.md)

</td><td>

A comprehensive component for displaying resource resolution results with multiple view modes.

</td></tr>
<tr><td>

[NavigationWarningModal](./variables/NavigationWarningModal.md)

</td><td>

Modal component for warning users about unsaved changes before navigation

</td></tr>
<tr><td>

[AppHeader](./variables/AppHeader.md)

</td><td>

Generic app header component with configurable icon, title, and description

</td></tr>
</tbody></table>
