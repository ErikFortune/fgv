[Home](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > thinkingMode

## IAiProviderDescriptor.thinkingMode property

Whether this provider supports thinking/reasoning mode.
- 'optional': thinking can be enabled but is not required
- 'required': thinking is always active (e.g. o-series models)
- 'unsupported': thinking is not supported

**Signature:**

```typescript
readonly thinkingMode: AiThinkingMode;
```
