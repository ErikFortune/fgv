[Home](../README.md) > [BaseConverter](./BaseConverter.md) > withAction

## BaseConverter.withAction() method

Creates a Converter | Converter which applies a supplied action after
conversion. The supplied action is always called regardless of success or failure
of the base conversion and is allowed to mutate the return type.

**Signature:**

```typescript
withAction(action: (result: Result<T>, context?: TC) => Result<TI>): Converter<TI, TC>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>action</td><td>(result: Result&lt;T&gt;, context?: TC) =&gt; Result&lt;TI&gt;</td><td>The action to be applied.</td></tr>
</tbody></table>

**Returns:**

[Converter](../interfaces/Converter.md)&lt;TI, TC&gt;
