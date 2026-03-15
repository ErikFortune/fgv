[Home](../README.md) > IMaterializedLibraryParams

# Interface: IMaterializedLibraryParams

Parameters for constructing a MaterializedLibrary.

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

[inner](./IMaterializedLibraryParams.inner.md)

</td><td>



</td><td>

IReadOnlyResultMap&lt;TId, TEntity&gt;

</td><td>

The underlying data library (SubLibraryBase or similar).

</td></tr>
<tr><td>

[converter](./IMaterializedLibraryParams.converter.md)

</td><td>



</td><td>

(entity: TEntity, id: TId) =&gt; Result&lt;TMaterialized&gt;

</td><td>

Converter function: (entity, id) =\> Result\<TMaterialized\>

</td></tr>
<tr><td>

[orchestrator](./IMaterializedLibraryParams.orchestrator.md)

</td><td>



</td><td>

[IFindOrchestrator](IFindOrchestrator.md)&lt;TMaterialized, TQuerySpec&gt;

</td><td>

Optional orchestrator for find/query support.

</td></tr>
<tr><td>

[logger](./IMaterializedLibraryParams.logger.md)

</td><td>



</td><td>

ILogger

</td><td>

Optional logger for conversion warnings.

</td></tr>
<tr><td>

[onConversionError](./IMaterializedLibraryParams.onConversionError.md)

</td><td>



</td><td>

ConversionErrorHandling

</td><td>

Error handling behavior for conversion failures during iteration.

</td></tr>
</tbody></table>
