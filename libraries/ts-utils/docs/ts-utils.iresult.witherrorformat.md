<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [IResult](./ts-utils.iresult.md) &gt; [withErrorFormat](./ts-utils.iresult.witherrorformat.md)

## IResult.withErrorFormat() method

Calls a supplied [error formatter](./ts-utils.errorformatter.md) if the operation failed.

**Signature:**

```typescript
withErrorFormat(cb: ErrorFormatter): Result<T>;
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

cb


</td><td>

[ErrorFormatter](./ts-utils.errorformatter.md)


</td><td>

The [error formatter](./ts-utils.errorformatter.md) to be called in the event of failure.


</td></tr>
</tbody></table>
**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;T&gt;

If this operation failed, returns the returns [Failure](./ts-utils.failure.md) with the message returned by the formatter. If this result was successful, propagates the result value from the successful event.

