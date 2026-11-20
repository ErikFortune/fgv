[Home](../README.md) > [IAiStreamDone](./IAiStreamDone.md) > incompleteReason

## IAiStreamDone.incompleteReason property

Provider-reported reason a truncated response was cut short (e.g.
`'max_output_tokens'`, `'content_filter'`), when the provider supplies one.
Currently populated only by the OpenAI / xAI Responses adapter, from the
completed payload's `incomplete_details.reason`. Meaningful only when
`truncated === true`; `undefined` otherwise (and whenever the provider
reports truncation without a reason).

**Signature:**

```typescript
readonly incompleteReason: string;
```
