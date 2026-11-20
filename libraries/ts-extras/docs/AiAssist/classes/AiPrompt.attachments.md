[Home](../../README.md) > [AiAssist](../README.md) > [AiPrompt](./AiPrompt.md) > attachments

## AiPrompt.attachments property

Optional image attachments. When present, vision-capable providers will
include them in the user message; non-vision providers will reject the
call up front (see AiAssist.IAiProviderDescriptor.acceptsImageInput).

**Signature:**

```typescript
readonly attachments: readonly IAiImageAttachment[];
```
