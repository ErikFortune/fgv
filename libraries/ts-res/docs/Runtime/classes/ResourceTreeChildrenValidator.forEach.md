[Home](../../README.md) > [Runtime](../README.md) > [ResourceTreeChildrenValidator](./ResourceTreeChildrenValidator.md) > forEach

## ResourceTreeChildrenValidator.forEach() method

Executes a callback function for each child node in the collection.

**Signature:**

```typescript
forEach(cb: (value: unknown, key: string, map: IReadOnlyResultMap<string, unknown>, thisArg?: unknown) => void, arg?: unknown): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>cb</td><td>(value: unknown, key: string, map: IReadOnlyResultMap&lt;string, unknown&gt;, thisArg?: unknown) =&gt; void</td><td>The callback function to execute for each child node</td></tr>
<tr><td>arg</td><td>unknown</td><td>Optional argument to pass to the callback</td></tr>
</tbody></table>

**Returns:**

void
