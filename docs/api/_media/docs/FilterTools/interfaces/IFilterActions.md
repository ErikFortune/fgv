[Home](../../README.md) > [FilterTools](../README.md) > IFilterActions

# Interface: IFilterActions

Actions available for managing filter state.
Provides methods for updating all aspects of resource filtering.

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

[updateFilterEnabled](./IFilterActions.updateFilterEnabled.md)

</td><td>



</td><td>

(enabled: boolean) =&gt; void

</td><td>

Enable or disable filtering

</td></tr>
<tr><td>

[updateFilterValues](./IFilterActions.updateFilterValues.md)

</td><td>



</td><td>

(values: Record&lt;string, string | undefined&gt;) =&gt; void

</td><td>

Update filter values (does not apply them until applyFilterValues is called)

</td></tr>
<tr><td>

[applyFilterValues](./IFilterActions.applyFilterValues.md)

</td><td>



</td><td>

() =&gt; void

</td><td>

Apply current filter values to create a filtered resource manager

</td></tr>
<tr><td>

[resetFilterValues](./IFilterActions.resetFilterValues.md)

</td><td>



</td><td>

() =&gt; void

</td><td>

Reset filter values to their applied state (discards pending changes)

</td></tr>
<tr><td>

[updateReduceQualifiers](./IFilterActions.updateReduceQualifiers.md)

</td><td>



</td><td>

(reduceQualifiers: boolean) =&gt; void

</td><td>

Enable or disable qualifier reduction during filtering

</td></tr>
</tbody></table>
