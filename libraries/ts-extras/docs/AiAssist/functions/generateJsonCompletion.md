[Home](../../README.md) > [AiAssist](../README.md) > generateJsonCompletion

# Function: generateJsonCompletion

Calls AiAssist.callProviderCompletion, then runs the response text
through a tolerant JSON converter (default:
AiAssist.fencedStringifiedJson) and the caller's
`converter`/`validator`. Returns the validated value plus the raw text and
underlying completion response for diagnostics.

## Signature

```typescript
function generateJsonCompletion(params: IGenerateJsonCompletionParams<T>): Promise<Result<IGenerateJsonCompletionResult<T>>>
```
