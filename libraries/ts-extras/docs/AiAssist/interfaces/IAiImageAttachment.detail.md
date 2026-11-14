[Home](../../README.md) > [AiAssist](../README.md) > [IAiImageAttachment](./IAiImageAttachment.md) > detail

## IAiImageAttachment.detail property

OpenAI vision detail hint:
- `'low'`: faster, cheaper, lower fidelity
- `'high'`: slower, more expensive, higher fidelity
- `'auto'` (default): provider chooses

Ignored by providers other than OpenAI.

**Signature:**

```typescript
readonly detail: "auto" | "high" | "low";
```
