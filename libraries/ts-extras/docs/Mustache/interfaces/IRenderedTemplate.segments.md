[Home](../../README.md) > [Mustache](../README.md) > [IRenderedTemplate](./IRenderedTemplate.md) > segments

## IRenderedTemplate.segments property

Document-ordered, contiguous and gapless: every code unit of `text` belongs to exactly one
segment, so concatenating them reproduces `text` exactly. That identity is verified before
this is returned.

**Signature:**

```typescript
readonly segments: readonly IRenderedSegment[];
```
