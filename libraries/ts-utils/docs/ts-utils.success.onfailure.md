<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Success](./ts-utils.success.md) &gt; [onFailure](./ts-utils.success.onfailure.md)

## Success.onFailure() method

Calls a supplied [failed continuation](./ts-utils.failurecontinuation.md) if the operation failed.

**Signature:**

```typescript
onFailure(__: FailureContinuation<T>): Result<T>;
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

\_\_


</td><td>

[FailureContinuation](./ts-utils.failurecontinuation.md)<!-- -->&lt;T&gt;


</td><td>


</td></tr>
</tbody></table>
**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;T&gt;

If this operation failed, returns the value returned by the [failure continuation](./ts-utils.failurecontinuation.md)<!-- -->. If this result was successful, propagates the result value from the successful event.

