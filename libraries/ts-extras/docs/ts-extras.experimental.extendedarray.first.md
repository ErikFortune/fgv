<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-extras](./ts-extras.md) &gt; [Experimental](./ts-extras.experimental.md) &gt; [ExtendedArray](./ts-extras.experimental.extendedarray.md) &gt; [first](./ts-extras.experimental.extendedarray.first.md)

## Experimental.ExtendedArray.first() method

> This API is provided as a beta preview for developers and may change based on feedback that we receive. Do not use this API in a production environment.
> 

Returns the first element of an [ExtendedArray](./ts-extras.experimental.extendedarray.md)<!-- -->. Fails with an error message if the array is empty.

**Signature:**

```typescript
first(failMessage?: string): Result<T>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  failMessage | string | _(Optional)_ Optional message to be displayed in the event of failure. |

**Returns:**

Result&lt;T&gt;

Returns `Success<T>` with the value of the first element in the array, or `Failure<T>` with an error message if the array is empty.

