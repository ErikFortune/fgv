[Home](../../README.md) > [Config](../README.md) > [ISystemConfigurationInitParams](./ISystemConfigurationInitParams.md) > qualifierDefaultValues

## ISystemConfigurationInitParams.qualifierDefaultValues property

Optional map of qualifier names to default values. If provided, qualifiers
in the system configuration will be updated with these default values.
Use `null` as the value to remove an existing default value.

**Signature:**

```typescript
qualifierDefaultValues: Record<string, string | null>;
```
