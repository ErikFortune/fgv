<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validation](./ts-utils.validation.md) &gt; [ValidatorTraits](./ts-utils.validation.validatortraits.md) &gt; [(constructor)](./ts-utils.validation.validatortraits._constructor_.md)

## Validation.ValidatorTraits.(constructor)

Constructs a new [ValidatorTraits](./ts-utils.validation.validatortraits.md) optionally initialized with the supplied base and initial values.

**Signature:**

```typescript
constructor(init?: Partial<ValidatorTraitValues>, base?: ValidatorTraitValues);
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  init | Partial&lt;[ValidatorTraitValues](./ts-utils.validation.validatortraitvalues.md)<!-- -->&gt; | _(Optional)_ Partial initial values to be set in the resulting [Validator](./ts-utils.validation.validator.md)<!-- -->. |
|  base | [ValidatorTraitValues](./ts-utils.validation.validatortraitvalues.md) | _(Optional)_ Base values to be used when no initial values are present. |

## Remarks

Initial values take priority over base values, which fall back to the global default values.

