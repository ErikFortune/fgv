[Home](../../README.md) > [Mustache](../README.md) > [IMustacheTemplateOptions](./IMustacheTemplateOptions.md) > escape

## IMustacheTemplateOptions.escape property

Escape strategy applied to double-brace `{{name}}` tokens at render
time. Default `'html'` preserves the existing mustache.js behavior
(back-compat).

Pass `'none'` for LLM-prompt or other non-HTML targets where the
default `& → &amp;` escape would corrupt the output. Pass a custom
function for any other escape policy.

The strategy is applied per-template via a private `Mustache.Writer`
instance; no global state on the `mustache` module is mutated, so
concurrent templates with different strategies are safe.

Note: triple-brace `{{{name}}}` tokens are always rendered unescaped
regardless of strategy (standard mustache.js semantics).

**Signature:**

```typescript
readonly escape: MustacheEscapeStrategy;
```
