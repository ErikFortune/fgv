[Home](../../README.md) > [Conversion](../README.md) > [Converter](./Converter.md) > withAction

## Converter.withAction() method

Creates a Converter | Converter which applies a supplied action after
conversion.  The supplied action is always called regardless of success or failure
of the base conversion and is allowed to mutate the return type.

**Signature:**

```typescript
withAction(action: (result: Result<T>, context?: TC) => Result<T2>): Converter<T2, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>action</td><td>(result: Result&lt;T&gt;, context?: TC) =&gt; Result&lt;T2&gt;</td><td>The action to be applied.</td></tr>
</tbody></table>

**Returns:**

[Converter](../../interfaces/Converter.md)&lt;T2, TC&gt;
