[Home](../README.md) > JsonPromptHint

# Type Alias: JsonPromptHint

Controls the optional system-prompt augmentation applied by
AiAssist.generateJsonCompletion.

- `'smart'` (default): append AiAssist.SMART_JSON_PROMPT_HINT.
- `'none'`: do not modify the prompt.
- A string: append the supplied text verbatim.

## Type

```typescript
type JsonPromptHint = "smart" | "none" | string & {}
```
