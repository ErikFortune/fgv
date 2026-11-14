[Home](../README.md) > [GenericDefaultingConverter](./GenericDefaultingConverter.md) > convertOptional

## GenericDefaultingConverter.convertOptional() method

Converts from `unknown` to `<T>` or `undefined`, as appropriate.

**Signature:**

```typescript
convertOptional(from: unknown, context?: TC, onError?: "failOnError" | "ignoreErrors"): Result<T | TD | undefined>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>from</td><td>unknown</td><td>The `unknown` to be converted</td></tr>
<tr><td>context</td><td>TC</td><td>An optional conversion context of type `<TC>` to be used in
the conversion.</td></tr>
<tr><td>onError</td><td>"failOnError" | "ignoreErrors"</td><td>Specifies handling of values that cannot be converted (default `ignoreErrors`).</td></tr>
</tbody></table>

**Returns:**

[Result](../type-aliases/Result.md)&lt;T | TD | undefined&gt;

A Result with a Success and a value on success or an
Failure with a a message on failure.
