<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-utils](./ts-utils.md) &gt; [Failure](./ts-utils.failure.md) &gt; [onFailure](./ts-utils.failure.onfailure.md)

## Failure.onFailure() method

Calls a supplied [failed continuation](./ts-utils.failurecontinuation.md) if the operation failed.

**Signature:**

```typescript
onFailure(cb: FailureContinuation<T>): Result<T>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  cb | [FailureContinuation](./ts-utils.failurecontinuation.md)<!-- -->&lt;T&gt; | The [failure continuation](./ts-utils.failurecontinuation.md) to be called in the event of failure. |

**Returns:**

[Result](./ts-utils.result.md)<!-- -->&lt;T&gt;

If this operation failed, returns the value returned by the [failure continuation](./ts-utils.failurecontinuation.md)<!-- -->. If this result was successful, propagates the result value from the successful event.
