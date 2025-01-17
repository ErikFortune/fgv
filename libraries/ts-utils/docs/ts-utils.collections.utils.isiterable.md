<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Collections](./ts-utils.collections.md) &gt; [Utils](./ts-utils.collections.utils.md) &gt; [isIterable](./ts-utils.collections.utils.isiterable.md)

## Collections.Utils.isIterable() function

Determines if a supplied value is an iterable object or some other type.

**Signature:**

```typescript
export declare function isIterable<TE = unknown, TI extends Iterable<TE> = Iterable<TE>, TO = unknown>(value: TI | TO): value is TI;
```

## Parameters

<table><thead><tr><th>

Parameter


</th><th>

Type


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

value


</td><td>

TI \| TO


</td><td>

The value to be tested.


</td></tr>
</tbody></table>
**Returns:**

value is TI

`true` if the value is an iterable object, `false` otherwise.

