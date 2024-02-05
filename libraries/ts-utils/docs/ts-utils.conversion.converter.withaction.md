<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [Converter](./ts-utils.conversion.converter.md) &gt; [withAction](./ts-utils.conversion.converter.withaction.md)

## Conversion.Converter.withAction() method

Creates a [Converter](./ts-utils.converter.md) which applies a supplied action after conversion. The supplied action is always called regardless of success or failure of the base conversion and is allowed to mutate the return type.

**Signature:**

```typescript
withAction<T2>(action: (result: Result<T>) => Result<T2>): Converter<T2, TC>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  action | (result: [Result](./ts-utils.result.md)<!-- -->&lt;T&gt;) =&gt; [Result](./ts-utils.result.md)<!-- -->&lt;T2&gt; | The action to be applied. |

**Returns:**

[Converter](./ts-utils.converter.md)<!-- -->&lt;T2, TC&gt;
