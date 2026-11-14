[Home](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > structuredOutput

## IAiProviderDescriptor.structuredOutput property

Per-model-family structured-output capability, longest-prefix matched against
the **resolved** completion model id. Absent (or no matching entry) means the
model can enforce nothing, and a request against it reports `'none'`.

**Signature:**

```typescript
readonly structuredOutput: readonly IAiStructuredOutputCapability[];
```
