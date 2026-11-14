[Home](../../README.md) > [AiAssist](../README.md) > [IAiImageModelCapability](./IAiImageModelCapability.md) > outputParamStyle

## IAiImageModelCapability.outputParamStyle property

How to encode the output format on the wire:
- 'response-format': send response_format: 'b64_json' (openai-images catch-all)
- 'output-format': send output_format (gpt-image-1)
- 'none': send neither (Gemini Flash)

**Signature:**

```typescript
readonly outputParamStyle: "none" | "response-format" | "output-format";
```
