[Home](../README.md) > [ResourceResolver](./ResourceResolver.md) > decisionCache

## ResourceResolver.decisionCache property

The cache array for resolved decisions, indexed by decision index for O(1) lookup.
Each entry stores the resolved DecisionResolutionResult for the corresponding decision.

**Signature:**

```typescript
readonly decisionCache: readonly (DecisionResolutionResult | undefined)[];
```
