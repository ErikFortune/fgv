[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IModelSpecMap

# Interface: IModelSpecMap

A model specification: either a simple model string or a record mapping
context keys to nested model specs.

## Remarks

A bare string is equivalent to `{ base: string }`. This keeps the simple
case simple while allowing context-aware model selection (e.g. different
models for different quality tiers).

## Example

```typescript
// Simple — same model for all contexts:
const simple: ModelSpec = 'grok-4.3';

// Context-aware — different model per quality tier:
const split: ModelSpec = { base: 'gpt-5.6-luna', advanced: 'gpt-5.6-terra', frontier: 'gpt-5.6-sol' };

// Nested — a tier branch is itself a spec:
const nested: ModelSpec = { base: 'grok-fast', advanced: { base: 'grok-r', image: 'grok-v' } };
```

## Indexable

> \[`key`: `string`\]: [`ModelSpec`](../type-aliases/ModelSpec.md)
