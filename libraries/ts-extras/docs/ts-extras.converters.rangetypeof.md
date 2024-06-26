<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-extras](./ts-extras.md) &gt; [Converters](./ts-extras.converters.md) &gt; [rangeTypeOf](./ts-extras.converters.rangetypeof.md)

## Converters.rangeTypeOf() function

A helper wrapper to construct a `Converter` which converts to an arbitrary strongly-typed range of some comparable type.

**Signature:**

```typescript
export declare function rangeTypeOf<T, RT extends RangeOf<T>, TC = unknown>(converter: Converter<T, TC>, constructor: (init: RangeOfProperties<T>) => Result<RT>): Converter<RT, TC>;
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

converter


</td><td>

Converter&lt;T, TC&gt;


</td><td>

`Converter` used to convert `min` and `max` extent of the range.


</td></tr>
<tr><td>

constructor


</td><td>

(init: [RangeOfProperties](./ts-extras.experimental.rangeofproperties.md)<!-- -->&lt;T&gt;) =&gt; Result&lt;RT&gt;


</td><td>

Static constructor to instantiate the object.


</td></tr>
</tbody></table>
**Returns:**

Converter&lt;RT, TC&gt;

