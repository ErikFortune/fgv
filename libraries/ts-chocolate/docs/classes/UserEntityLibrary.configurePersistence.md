[Home](../README.md) > [UserEntityLibrary](./UserEntityLibrary.md) > configurePersistence

## UserEntityLibrary.configurePersistence() method

Configures persistence providers for all sub-libraries.
Must be called before using any `getPersisted*Collection` or `saveCollection` methods.

**Signature:**

```typescript
configurePersistence(config: IUserEntityPersistenceConfig): void;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>IUserEntityPersistenceConfig</td><td>Persistence configuration with sync and encryption providers</td></tr>
</tbody></table>

**Returns:**

void
