[Home](../../README.md) > [AiAssist](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > acceptsImageInput

## IAiProviderDescriptor.acceptsImageInput property

Whether this provider's chat completions API accepts image input
(i.e. supports vision prompts). When false, calls with
`prompt.attachments` are rejected up front.

**Signature:**

```typescript
readonly acceptsImageInput: boolean;
```
