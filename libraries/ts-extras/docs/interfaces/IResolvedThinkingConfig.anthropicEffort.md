[Home](../README.md) > [IResolvedThinkingConfig](./IResolvedThinkingConfig.md) > anthropicEffort

## IResolvedThinkingConfig.anthropicEffort property

Anthropic: effort level. The emit-site picks one of two wire shapes — on the
Claude 5 family it sends the effort string verbatim in `output_config` with no
budget; on older models it converts via `anthropicEffortToBudgetTokens`. See
AiAssist.IAnthropicThinkingConfig.effort.

**Signature:**

```typescript
readonly anthropicEffort: "max" | "high" | "low" | "medium";
```
