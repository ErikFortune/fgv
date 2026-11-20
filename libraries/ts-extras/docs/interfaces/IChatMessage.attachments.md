[Home](../README.md) > [IChatMessage](./IChatMessage.md) > attachments

## IChatMessage.attachments property

Optional image attachments. Only honoured on the **current turn** (the last
message of an AiAssist.IChatRequest); vision-capable providers include
them in that user message, non-vision providers reject the call up front (see
AiAssist.IAiProviderDescriptor.acceptsImageInput). Attachments on
history (non-final) messages are ignored.

**Signature:**

```typescript
readonly attachments: readonly IAiImageAttachment[];
```
