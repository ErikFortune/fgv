<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [GenericDefaultingConverter](./ts-utils.conversion.genericdefaultingconverter.md) &gt; [withConstraint](./ts-utils.conversion.genericdefaultingconverter.withconstraint.md)

## Conversion.GenericDefaultingConverter.withConstraint() method

Creates a [Converter](./ts-utils.converter.md) which applies an optional constraint to the result of this conversion. If this [Converter](./ts-utils.converter.md) (the base converter) succeeds, the new converter calls a supplied constraint evaluation function with the conversion, which fails the entire conversion if the constraint function returns either `false` or [Failure&lt;T&gt;](./ts-utils.failure.md)<!-- -->.

**Signature:**

```typescript
withConstraint(constraint: (val: T | TD) => boolean | Result<T | TD>, options?: ConstraintOptions | undefined): Converter<T | TD, TC>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  constraint | (val: T \| TD) =&gt; boolean \| [Result](./ts-utils.result.md)<!-- -->&lt;T \| TD&gt; | Constraint evaluation function. |
|  options | [ConstraintOptions](./ts-utils.conversion.constraintoptions.md) \| undefined | _(Optional)_ [Options](./ts-utils.conversion.constraintoptions.md) for constraint evaluation. |

**Returns:**

[Converter](./ts-utils.converter.md)<!-- -->&lt;T \| TD, TC&gt;

A new [Converter](./ts-utils.converter.md) returning `<T>`<!-- -->.

