<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validation](./ts-utils.validation.md) &gt; [Validators](./ts-utils.validation.validators.md) &gt; [literal](./ts-utils.validation.validators.literal.md)

## Validation.Validators.literal() function

Helper function to create a [Validation.Validator](./ts-utils.validation.validator.md) which validates a literal value.

**Signature:**

```typescript
export declare function literal<T extends string | number | boolean | symbol | null | undefined>(value: T): Validator<T>;
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

T


</td><td>

the literal value to be validated


</td></tr>
</tbody></table>
**Returns:**

[Validator](./ts-utils.validator.md)<!-- -->&lt;T&gt;

