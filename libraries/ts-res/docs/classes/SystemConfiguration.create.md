[Home](../README.md) > [SystemConfiguration](./SystemConfiguration.md) > create

## SystemConfiguration.create() method

Creates a new Config.SystemConfiguration | SystemConfiguration from the supplied
Config.Model.ISystemConfiguration | system configuration.

**Signature:**

```typescript
static create(config: ISystemConfiguration, initParams?: ISystemConfigurationInitParams): Result<SystemConfiguration>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>config</td><td>ISystemConfiguration</td><td>The Config.Model.ISystemConfiguration | system configuration to use.</td></tr>
<tr><td>initParams</td><td>ISystemConfigurationInitParams</td><td>Optional Config.ISystemConfigurationInitParams | initialization parameters.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[SystemConfiguration](SystemConfiguration.md)&gt;

`Success` with the new Config.SystemConfiguration | SystemConfiguration
if successful, `Failure` with an error message otherwise.
