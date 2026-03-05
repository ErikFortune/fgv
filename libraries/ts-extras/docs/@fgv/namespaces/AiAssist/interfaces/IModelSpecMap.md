[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / IModelSpecMap

# Interface: IModelSpecMap

A model specification: either a simple model string or a record mapping
context keys to nested model specs.

## Remarks

A bare string is equivalent to `{ base: string }`. This keeps the simple
case simple while allowing context-aware model selection (e.g. different
models for tool-augmented vs. base completions).

## Example

```typescript
// Simple — same model for all contexts:
const simple: ModelSpec = 'grok-4-1-fast';

// Context-aware — reasoning model when tools are active:
const split: ModelSpec = { base: 'grok-4-1-fast', tools: 'grok-4-1-fast-reasoning' };

// Future nested — per-tool model selection:
const nested: ModelSpec = { base: 'grok-fast', tools: { base: 'grok-r', image: 'grok-v' } };
```

## Indexable

\[`key`: `string`\]: [`ModelSpec`](../type-aliases/ModelSpec.md)
