<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Collections](./ts-utils.collections.md) &gt; [IReadOnlyValidatingResultMap](./ts-utils.collections.ireadonlyvalidatingresultmap.md)

## Collections.IReadOnlyValidatingResultMap interface

A read-only interface exposing non-mutating methods of a [ValidatingResultMap](./ts-utils.collections.validatingresultmap.md)<!-- -->.

**Signature:**

```typescript
export interface IReadOnlyValidatingResultMap<TK extends string = string, TV = unknown> extends IReadOnlyResultMap<TK, TV> 
```
**Extends:** [IReadOnlyResultMap](./ts-utils.ireadonlyresultmap.md)<!-- -->&lt;TK, TV&gt;

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

[validating](./ts-utils.collections.ireadonlyvalidatingresultmap.validating.md)


</td><td>

`readonly`


</td><td>

[IReadOnlyResultMapValidator](./ts-utils.collections.ireadonlyresultmapvalidator.md)<!-- -->&lt;TK, TV&gt;


</td><td>

A [ResultMapValidator](./ts-utils.collections.resultmapvalidator.md) which validates keys and values before inserting them into this collection.


</td></tr>
</tbody></table>
