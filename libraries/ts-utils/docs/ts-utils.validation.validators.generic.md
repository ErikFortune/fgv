<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validation](./ts-utils.validation.md) &gt; [Validators](./ts-utils.validation.validators.md) &gt; [generic](./ts-utils.validation.validators.generic.md)

## Validation.Validators.generic() function

Helper function to create a [Validator](./ts-utils.validation.validator.md) using a supplied [validator function](./ts-utils.validation.validatorfunc.md)<!-- -->.

**Signature:**

```typescript
export declare function generic<T, TC = unknown>(validator: ValidatorFunc<T, TC>): Validator<T, TC>;
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

validator


</td><td>

[ValidatorFunc](./ts-utils.validation.base.validatorfunc.md)<!-- -->&lt;T, TC&gt;


</td><td>

A [validator function](./ts-utils.validation.validatorfunc.md) that a supplied unknown value matches some condition.


</td></tr>
</tbody></table>
**Returns:**

[Validator](./ts-utils.validator.md)<!-- -->&lt;T, TC&gt;

A new [Validator](./ts-utils.validation.validator.md) which validates the desired value using the supplied function.

