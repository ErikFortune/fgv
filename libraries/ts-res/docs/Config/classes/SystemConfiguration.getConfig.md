[Home](../../README.md) > [Config](../README.md) > [SystemConfiguration](./SystemConfiguration.md) > getConfig

## SystemConfiguration.getConfig() method

Returns the Config.Model.ISystemConfiguration | system configuration that this
Config.SystemConfiguration | SystemConfiguration was created from.

**Signature:**

```typescript
getConfig(): Result<ISystemConfiguration>;
```

**Returns:**

Result&lt;[ISystemConfiguration](../../interfaces/ISystemConfiguration.md)&gt;

`Success` with the Config.Model.ISystemConfiguration | system configuration
if successful, `Failure` with an error message otherwise.
