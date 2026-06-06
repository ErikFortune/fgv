[Home](../README.md) > resolveEffectiveTools

# Function: resolveEffectiveTools

Resolves the effective tools for a completion call.

- If per-call tools are provided, they override settings-level tools entirely.
- Otherwise, settings-level enabled tools are used.
- Only tools supported by the provider are included.
- Returns an empty array if no tools are enabled (= no tools sent).

## Signature

```typescript
function resolveEffectiveTools(descriptor: IAiProviderDescriptor, settingsTools: readonly IAiToolEnablement[], perCallTools: readonly IAiWebSearchToolConfig[]): readonly IAiWebSearchToolConfig[]
```
