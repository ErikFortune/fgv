[Home](../../README.md) > [Settings](../README.md) > splitCommonSettings

# Function: splitCommonSettings

Splits a legacy ICommonSettings into bootstrap + preferences.
Used for one-time migration from common.json.

## Signature

```typescript
function splitCommonSettings(common: ICommonSettings): { bootstrap: IBootstrapSettings; preferences: IPreferencesSettings }
```
