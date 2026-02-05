[Home](../README.md) > MaterializedLibrary

# Class: MaterializedLibrary

A read-only library providing lazily-materialized, cached runtime objects.
Wraps a data-layer library and converts entities to materialized objects on demand.

**Extends:** `ReadOnlyConvertingResultMap<TId, TEntity, TMaterialized>`

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(params)`

</td><td>



</td><td>

Creates a new MaterializedLibrary.

</td></tr>
</tbody></table>

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

[hasFindSupport](./MaterializedLibrary.hasFindSupport.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether find is supported on this library.

</td></tr>
<tr><td>

[size](./MaterializedLibrary.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of entries in the map.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(params)](./MaterializedLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new Collections.ReadOnlyConvertingResultMap | ReadOnlyConvertingResultMap.

</td></tr>
<tr><td>

[find(spec, options)](./MaterializedLibrary.find.md)

</td><td>



</td><td>

Finds materialized objects matching a query specification.

</td></tr>
<tr><td>

[getPreferred(spec)](./MaterializedLibrary.getPreferred.md)

</td><td>



</td><td>

Gets the preferred (or first) materialized item from an IIdsWithPreferred.

</td></tr>
<tr><td>

[getWithAlternates(spec)](./MaterializedLibrary.getWithAlternates.md)

</td><td>



</td><td>

Gets the preferred item and all alternates from an IIdsWithPreferred.

</td></tr>
<tr><td>

[getPreferredRef(spec)](./MaterializedLibrary.getPreferredRef.md)

</td><td>



</td><td>

Gets the preferred (or first) materialized item from an IOptionsWithPreferred<IRefWithNotes>.

</td></tr>
<tr><td>

[getRefsWithAlternates(spec)](./MaterializedLibrary.getRefsWithAlternates.md)

</td><td>



</td><td>

Gets the preferred item and all alternates from an IOptionsWithPreferred containing IRefWithNotes.

</td></tr>
<tr><td>

[get(key)](./MaterializedLibrary.get.md)

</td><td>



</td><td>

Gets a converted value from the map by key.

</td></tr>
<tr><td>

[has(key)](./MaterializedLibrary.has.md)

</td><td>



</td><td>

Checks if the map contains a key.

</td></tr>
<tr><td>

[entries()](./MaterializedLibrary.entries.md)

</td><td>



</td><td>

Returns an iterator over the map entries with converted values.

</td></tr>
<tr><td>

[keys()](./MaterializedLibrary.keys.md)

</td><td>



</td><td>

Returns an iterator over the map keys.

</td></tr>
<tr><td>

[values()](./MaterializedLibrary.values.md)

</td><td>



</td><td>

Returns an iterator over the converted map values.

</td></tr>
<tr><td>

[forEach(cb, thisArg)](./MaterializedLibrary.forEach.md)

</td><td>



</td><td>

Calls a callback for each entry in the map with converted values.

</td></tr>
<tr><td>

[toReadOnly()](./MaterializedLibrary.toReadOnly.md)

</td><td>



</td><td>

Gets a read-only version of this map.

</td></tr>
<tr><td>

[[iterator]()](./MaterializedLibrary._iterator_.md)

</td><td>



</td><td>

Gets an iterator over the map entries.

</td></tr>
</tbody></table>
