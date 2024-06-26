<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validation](./ts-utils.validation.md) &gt; [Validator](./ts-utils.validation.validator.md) &gt; [convert](./ts-utils.validation.validator.convert.md)

## Validation.Validator.convert() method

Tests to see if a supplied 'unknown' value matches this validation. In contrast to [validate](./ts-utils.validator.validate.md)<!-- -->, makes no guarantees about the identity of the returned value.

**Signature:**

```typescript
convert(from: unknown, context?: TC): Result<T>;
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

from


</td><td>

unknown


</td><td>

The `unknown` value to be tested.


</td></tr>
<tr><td>

context


</td><td>

TC


</td><td>

_(Optional)_ Optional validation context.


</td></tr>
</tbody></table>
**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;T&gt;

[Success](./ts-utils.success.md) with the typed, conversion value, or [Failure](./ts-utils.failure.md) with an error message if conversion fails.

