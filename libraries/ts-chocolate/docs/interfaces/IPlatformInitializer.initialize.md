[Home](../README.md) > [IPlatformInitializer](./IPlatformInitializer.md) > initialize

## IPlatformInitializer.initialize() method

Performs platform initialization (Stage 1).
- Creates crypto provider
- Resolves user library path to FileTree
- Loads settings (common and device-specific)
- Resolves external library references to FileTrees
- Loads key store file if present

**Signature:**

```typescript
initialize(options: IPlatformInitOptions): Promise<Result<IPlatformInitResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>options</td><td>IPlatformInitOptions</td><td>Platform initialization options</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IPlatformInitResult](IPlatformInitResult.md)&gt;&gt;

Success with init result, or Failure
