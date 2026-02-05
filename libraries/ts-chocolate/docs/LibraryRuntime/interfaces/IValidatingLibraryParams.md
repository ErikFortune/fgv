[Home](../../README.md) > [LibraryRuntime](../README.md) > IValidatingLibraryParams

# Interface: IValidatingLibraryParams

Parameters for ValidatingLibrary construction.

**Extends:** `IValidatingResultMapConstructorParams<TK, TV>`

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

[orchestrator](./IValidatingLibraryParams.orchestrator.md)

</td><td>



</td><td>

[IFindOrchestrator](../../interfaces/IFindOrchestrator.md)&lt;TOrchEntity, TSpec&gt;

</td><td>

The orchestrator that provides find functionality.

</td></tr>
<tr><td>

[entries](./IValidatingLibraryParams.entries.md)

</td><td>



</td><td>

Iterable&lt;KeyValueEntry&lt;string, unknown&gt;, any, any&gt;

</td><td>



</td></tr>
<tr><td>

[converters](./IValidatingLibraryParams.converters.md)

</td><td>



</td><td>

KeyValueConverters&lt;TK, TV&gt;

</td><td>



</td></tr>
</tbody></table>
