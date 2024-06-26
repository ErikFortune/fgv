<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validation](./ts-utils.validation.md) &gt; [ValidatorTraitValues](./ts-utils.validation.validatortraitvalues.md)

## Validation.ValidatorTraitValues interface

Interface describing the supported validator traits.

**Signature:**

```typescript
export interface ValidatorTraitValues 
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

[brand?](./ts-utils.validation.validatortraitvalues.brand.md)


</td><td>

`readonly`


</td><td>

string


</td><td>

_(Optional)_ If present, indicates that the result will be branded with the corresponding brand.


</td></tr>
<tr><td>

[constraints](./ts-utils.validation.validatortraitvalues.constraints.md)


</td><td>

`readonly`


</td><td>

[ConstraintTrait](./ts-utils.validation.constrainttrait.md)<!-- -->\[\]


</td><td>

Zero or more additional [ConstraintTrait](./ts-utils.validation.constrainttrait.md)<!-- -->s describing additional constraints applied by this [Validator](./ts-utils.validation.validator.md)<!-- -->.


</td></tr>
<tr><td>

[isOptional](./ts-utils.validation.validatortraitvalues.isoptional.md)


</td><td>

`readonly`


</td><td>

boolean


</td><td>

Indicates whether the validator accepts `undefined` as a valid value.


</td></tr>
</tbody></table>
