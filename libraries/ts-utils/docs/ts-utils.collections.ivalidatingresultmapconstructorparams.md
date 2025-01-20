<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Collections](./ts-utils.collections.md) &gt; [IValidatingResultMapConstructorParams](./ts-utils.collections.ivalidatingresultmapconstructorparams.md)

## Collections.IValidatingResultMapConstructorParams interface

Parameters for constructing a [ResultMap](./ts-utils.collections.resultmap.md)<!-- -->.

**Signature:**

```typescript
export interface IValidatingResultMapConstructorParams<TK extends string = string, TV = unknown> 
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

[entries?](./ts-utils.collections.ivalidatingresultmapconstructorparams.entries.md)


</td><td>


</td><td>

Iterable&lt;[KeyValueEntry](./ts-utils.collections.keyvalueentry.md)<!-- -->&lt;string, unknown&gt;&gt;


</td><td>

_(Optional)_


</td></tr>
<tr><td>

[validators](./ts-utils.collections.ivalidatingresultmapconstructorparams.validators.md)


</td><td>


</td><td>

[KeyValueValidators](./ts-utils.collections.utils.keyvaluevalidators.md)<!-- -->&lt;TK, TV&gt;


</td><td>


</td></tr>
</tbody></table>