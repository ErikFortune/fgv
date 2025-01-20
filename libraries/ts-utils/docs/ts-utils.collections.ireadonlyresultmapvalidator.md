<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Collections](./ts-utils.collections.md) &gt; [IReadOnlyResultMapValidator](./ts-utils.collections.ireadonlyresultmapvalidator.md)

## Collections.IReadOnlyResultMapValidator interface

A read-only interface exposing non-mutating methods of a [ResultMapValidator](./ts-utils.collections.resultmapvalidator.md)<!-- -->.

**Signature:**

```typescript
export interface IReadOnlyResultMapValidator<TK extends string = string, TV = unknown> 
```

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
<tbody><tr><td>

[map](./ts-utils.collections.ireadonlyresultmapvalidator.map.md)


</td><td>

`readonly`


</td><td>

[IReadOnlyResultMap](./ts-utils.ireadonlyresultmap.md)<!-- -->&lt;TK, TV&gt;


</td><td>



</td></tr>
<tr><td>

[validators](./ts-utils.collections.ireadonlyresultmapvalidator.validators.md)


</td><td>

`readonly`


</td><td>

[KeyValueValidators](./ts-utils.collections.utils.keyvaluevalidators.md)<!-- -->&lt;TK, TV&gt;


</td><td>



</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[get(key)](./ts-utils.collections.ireadonlyresultmapvalidator.get.md)


</td><td>

Gets a value from the map.


</td></tr>
<tr><td>

[has(key)](./ts-utils.collections.ireadonlyresultmapvalidator.has.md)


</td><td>

Returns `true` if the map contains a key.


</td></tr>
</tbody></table>