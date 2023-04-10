<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Conversion](./ts-utils.conversion.md) &gt; [BaseConverter](./ts-utils.conversion.baseconverter.md) &gt; [convertOptional](./ts-utils.conversion.baseconverter.convertoptional.md)

## Conversion.BaseConverter.convertOptional() method

Converts from `unknown` to `<T>` or `undefined`<!-- -->, as appropriate.

**Signature:**

```typescript
convertOptional(from: unknown, context?: TC, onError?: OnError): Result<T | undefined>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  from | unknown | The <code>unknown</code> to be converted |
|  context | TC | _(Optional)_ An optional conversion context of type <code>&lt;TC&gt;</code> to be used in the conversion. |
|  onError | OnError | _(Optional)_ Specifies handling of values that cannot be converted (default <code>ignoreErrors</code>). |

**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;T \| undefined&gt;

A [Result](./ts-utils.result.md) with a [Success](./ts-utils.success.md) and a value on success or an [Failure](./ts-utils.failure.md) with a a message on failure.

## Remarks

If `onError` is `failOnError`<!-- -->, the converter succeeds for `undefined` or any convertible value, but reports an error if it encounters a value that cannot be converted.

If `onError` is `ignoreErrors` (default) then values that cannot be converted result in a successful return of `undefined`<!-- -->.
