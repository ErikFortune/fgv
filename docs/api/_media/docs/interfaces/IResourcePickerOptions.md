[Home](../README.md) > IResourcePickerOptions

# Interface: IResourcePickerOptions

UI behavior configuration options for ResourcePicker.

This interface groups all UI-related options that control how the ResourcePicker
behaves and appears, separate from functional data like annotations and pending resources.

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

[defaultView](./IResourcePickerOptions.defaultView.md)

</td><td>



</td><td>

"list" | "tree"

</td><td>

Default view mode to use on initial render

</td></tr>
<tr><td>

[showViewToggle](./IResourcePickerOptions.showViewToggle.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to show the list/tree view toggle buttons

</td></tr>
<tr><td>

[rootPath](./IResourcePickerOptions.rootPath.md)

</td><td>



</td><td>

string

</td><td>

Path to treat as root for tree branch isolation (e.g., "platform/territories")

</td></tr>
<tr><td>

[hideRootNode](./IResourcePickerOptions.hideRootNode.md)

</td><td>



</td><td>

boolean

</td><td>

Hide the root node itself, showing only its children

</td></tr>
<tr><td>

[enableSearch](./IResourcePickerOptions.enableSearch.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to enable the search input

</td></tr>
<tr><td>

[searchPlaceholder](./IResourcePickerOptions.searchPlaceholder.md)

</td><td>



</td><td>

string

</td><td>

Placeholder text for the search input

</td></tr>
<tr><td>

[searchScope](./IResourcePickerOptions.searchScope.md)

</td><td>



</td><td>

"all" | "current-branch"

</td><td>

Scope of search - entire tree or just the currently visible branch

</td></tr>
<tr><td>

[emptyMessage](./IResourcePickerOptions.emptyMessage.md)

</td><td>



</td><td>

string

</td><td>

Message to display when no resources are available

</td></tr>
<tr><td>

[height](./IResourcePickerOptions.height.md)

</td><td>



</td><td>

string | number

</td><td>

Height of the picker component

</td></tr>
</tbody></table>
