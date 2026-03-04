[Home](../../README.md) > [LibraryRuntime](../README.md) > [ChocolateEntityLibrary](./ChocolateEntityLibrary.md) > configurePersistence

## ChocolateEntityLibrary.configurePersistence() method

Configure the persistence pipeline for this library.

Call this once during app initialization after the workspace and KeyStore
are available. Persisted collection wrappers created after this call will
use the provided sync and encryption providers.

**Signature:**

```typescript
configurePersistence(config: IPersistenceConfig): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>IPersistenceConfig</td><td>Persistence configuration</td></tr>
</tbody></table>

**Returns:**

void
