<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Converters](./ts-utils.converters.md) &gt; [isA](./ts-utils.converters.isa.md)

## Converters.isA() function

Helper function to create a [Converter](./ts-utils.converter.md) from a supplied type guard function.

**Signature:**

```typescript
export declare function isA<T, TC = unknown>(description: string, guard: TypeGuardWithContext<T, TC>): Converter<T, TC>;
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

description


</td><td>

string


</td><td>

a description of the thing to be validated for use in error messages


</td></tr>
<tr><td>

guard


</td><td>

[TypeGuardWithContext](./ts-utils.validation.typeguardwithcontext.md)<!-- -->&lt;T, TC&gt;


</td><td>

a [Validation.TypeGuardWithContext](./ts-utils.validation.typeguardwithcontext.md) which performs the validation.


</td></tr>
</tbody></table>
**Returns:**

[Converter](./ts-utils.converter.md)<!-- -->&lt;T, TC&gt;

A new [Converter](./ts-utils.converter.md) which validates the values using the supplied type guard and returns them in place.

