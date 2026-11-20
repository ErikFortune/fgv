[Home](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > addSecret

## KeyStore.addSecret() method

Adds a new secret with a randomly generated key.

**Signature:**

```typescript
addSecret(name: string, options?: IAddSecretOptions): Promise<Result<IAddSecretResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>name</td><td>string</td><td>Unique name for the secret</td></tr>
<tr><td>options</td><td>IAddSecretOptions</td><td>Optional description</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IAddSecretResult](../../interfaces/IAddSecretResult.md)&gt;&gt;

Success with the generated entry, Failure if locked or name invalid
