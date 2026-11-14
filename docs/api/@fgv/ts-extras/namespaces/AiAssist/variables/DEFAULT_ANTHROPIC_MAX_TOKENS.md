[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / DEFAULT\_ANTHROPIC\_MAX\_TOKENS

# Variable: DEFAULT\_ANTHROPIC\_MAX\_TOKENS

> `const` **DEFAULT\_ANTHROPIC\_MAX\_TOKENS**: `number` = `4096`

Default `max_tokens` sent to the Anthropic Messages API when the caller does
not supply an explicit `maxTokens` override.

## Remarks

Anthropic's Messages API requires `max_tokens` on every request — there is
no provider-side default the way there is for OpenAI Chat/Responses,
Gemini, or xAI, all of which accept a request with no cap and apply their
own default. Anthropic is therefore the only provider that needs — or
gets — a library-supplied fallback; every other provider omits the field
entirely when the caller doesn't set `maxTokens` (see
`IProviderCompletionParams.maxTokens`).

Callers whose structured/JSON output scales with input size and hits this
ceiling see a silent truncation that often surfaces downstream as a
confusing `extractJsonText` parse failure rather than an obvious "too
short" error — pass `maxTokens` explicitly to raise the cap for those
requests.
