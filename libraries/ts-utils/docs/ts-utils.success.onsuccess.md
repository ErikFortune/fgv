<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Success](./ts-utils.success.md) &gt; [onSuccess](./ts-utils.success.onsuccess.md)

## Success.onSuccess() method

Calls a supplied [success continuation](./ts-utils.successcontinuation.md) if the operation was a success.

**Signature:**

```typescript
onSuccess<TN>(cb: SuccessContinuation<T, TN>): Result<TN>;
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

[SuccessContinuation](./ts-utils.successcontinuation.md)<!-- -->&lt;T, TN&gt;


</td><td>

The [success continuation](./ts-utils.successcontinuation.md) to be called in the event of success.


</td></tr>
</tbody></table>
**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;TN&gt;

If this operation was successful, returns the value returned by the [success continuation](./ts-utils.successcontinuation.md)<!-- -->. If this result failed, propagates the error message from this failure.

## Remarks

The [success continuation](./ts-utils.successcontinuation.md) might return a different result type than [IResult](./ts-utils.iresult.md) on which it is invoked. This enables chaining of operations with heterogenous return types.

