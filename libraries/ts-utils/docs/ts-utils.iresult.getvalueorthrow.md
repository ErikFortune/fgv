<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [IResult](./ts-utils.iresult.md) &gt; [getValueOrThrow](./ts-utils.iresult.getvalueorthrow.md)

## IResult.getValueOrThrow() method

> Warning: This API is now obsolete.
> 
> Use [orThrow](./ts-utils.iresult.orthrow.md) instead.
> 

Gets the value associated with a successful [result](./ts-utils.iresult.md)<!-- -->, or throws the error message if the corresponding operation failed.

Note that `getValueOrThrow` is being superseded by `orThrow` and will eventually be deprecated. Please use orDefault instead.

**Signature:**

```typescript
getValueOrThrow(logger?: IResultLogger): T;
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

logger


</td><td>

[IResultLogger](./ts-utils.iresultlogger.md)


</td><td>

_(Optional)_ An optional [logger](./ts-utils.iresultlogger.md) to which the error will also be reported.


</td></tr>
</tbody></table>
**Returns:**

T

The return value, if the operation was successful.

## Exceptions

The error message if the operation failed.

