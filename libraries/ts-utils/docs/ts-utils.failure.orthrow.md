<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Failure](./ts-utils.failure.md) &gt; [orThrow](./ts-utils.failure.orthrow.md)

## Failure.orThrow() method

Gets the value associated with a successful [result](./ts-utils.iresult.md)<!-- -->, or throws the error message if the corresponding operation failed.

**Signature:**

```typescript
orThrow(logger?: IResultLogger): never;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  logger | [IResultLogger](./ts-utils.iresultlogger.md) | _(Optional)_ An optional [logger](./ts-utils.iresultlogger.md) to which the error will also be reported. |

**Returns:**

never

The return value, if the operation was successful.

