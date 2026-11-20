[Home](../../README.md) > [Config](../README.md) > [SystemConfiguration](./SystemConfiguration.md) > loadFromFile

## SystemConfiguration.loadFromFile() method

Loads a Config.SystemConfiguration | SystemConfiguration from a file.

**Signature:**

```typescript
static loadFromFile(path: string, initParams?: ISystemConfigurationInitParams): Result<SystemConfiguration>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>path</td><td>string</td><td>The path to the file to load.</td></tr>
<tr><td>initParams</td><td>ISystemConfigurationInitParams</td><td></td></tr>
</tbody></table>

**Returns:**

Result&lt;[SystemConfiguration](../../classes/SystemConfiguration.md)&gt;

`Success` with the Config.SystemConfiguration | SystemConfiguration
if successful, `Failure` with an error message otherwise.
