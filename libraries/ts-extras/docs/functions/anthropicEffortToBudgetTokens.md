[Home](../README.md) > anthropicEffortToBudgetTokens

# Function: anthropicEffortToBudgetTokens

Maps Anthropic effort level to the `thinking.budget_tokens` integer that the
Anthropic API requires when `thinking.type === 'enabled'`.

Policy: low = 2048, medium = 8192, high = 24000, max = 32000. The lower three
align with the Anthropic-published minimum-meaningful budget, a mid-range
default, and a "deep thinking" allotment respectively. `max` targets Opus 4.6's
deepest budget and stays within typical model limits.

## Signature

```typescript
function anthropicEffortToBudgetTokens(effort: NonNullable<"max" | "high" | "low" | "medium" | undefined>): number
```
