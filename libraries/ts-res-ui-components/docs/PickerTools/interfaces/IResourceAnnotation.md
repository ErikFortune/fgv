[Home](../../README.md) > [PickerTools](../README.md) > IResourceAnnotation

# Interface: IResourceAnnotation

Individual resource annotation configuration.

Supports multiple types of visual indicators that can be combined:
- Badge: Small colored badge with text
- Indicator: Dot, icon, or text indicator with optional tooltip
- Suffix: Additional content displayed after the resource name

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

[badge](./IResourceAnnotation.badge.md)

</td><td>



</td><td>

{ text: string; variant: "error" | "new" | "success" | "info" | "warning" | "edited" }

</td><td>

Small colored badge displayed next to the resource name

</td></tr>
<tr><td>

[indicator](./IResourceAnnotation.indicator.md)

</td><td>



</td><td>

{ type: "text" | "dot" | "icon"; value: ReactNode; tooltip?: string }

</td><td>

Visual indicator (dot, icon, or text) with optional tooltip

</td></tr>
<tr><td>

[suffix](./IResourceAnnotation.suffix.md)

</td><td>



</td><td>

ReactNode

</td><td>

Additional content displayed after the resource name (e.g., candidate counts)

</td></tr>
<tr><td>

[className](./IResourceAnnotation.className.md)

</td><td>



</td><td>

string

</td><td>

Additional CSS class names to apply to the resource item

</td></tr>
</tbody></table>
