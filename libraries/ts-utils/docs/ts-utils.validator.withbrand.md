<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Validator](./ts-utils.validator.md) &gt; [withBrand](./ts-utils.validator.withbrand.md)

## Validator.withBrand() method

Creates a new [in-place validator](./ts-utils.validation.validator.md) which is derived from this one but which matches a branded result.

**Signature:**

```typescript
withBrand<B extends string>(brand: B): Validator<Brand<T, B>, TC>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  brand | B | The brand to be applied. |

**Returns:**

[Validator](./ts-utils.validator.md)<!-- -->&lt;[Brand](./ts-utils.brand.md)<!-- -->&lt;T, B&gt;, TC&gt;

