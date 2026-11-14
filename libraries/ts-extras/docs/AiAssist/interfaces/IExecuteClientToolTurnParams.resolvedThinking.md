[Home](../../README.md) > [AiAssist](../README.md) > [IExecuteClientToolTurnParams](./IExecuteClientToolTurnParams.md) > resolvedThinking

## IExecuteClientToolTurnParams.resolvedThinking property

Optional resolved thinking config (pre-resolved by the caller). Sent as built, except that a
thinking-off value aimed at a model in `thinkingRequiredModelPrefixes` — `anthropicThinkingDisabled`
with no `anthropicEffort`, an OpenAI-format `openAiEffort` / `xaiEffort` of `'none'`, or a Gemini
`geminiThinkingBudget` of `0` — is refused before the wire, since the provider rejects it. On
Gemini, a `geminiThinkingLevel` the model does not accept (one its level declaration does not
list, or any level on a model in `geminiThinkingLevelRejectedModelPrefixes`), and a level and a
budget together, are refused too.

**Signature:**

```typescript
readonly resolvedThinking: IResolvedThinkingConfig;
```
