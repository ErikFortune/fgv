[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptSubstitutions

# Type Alias: PromptSubstitutions

> **PromptSubstitutions** = `Readonly`\<`Record`\<`string`, `string` \| [`SlotBinding`](SlotBinding.md)\>\>

Caller-supplied substitutions. A bare string is sugar for
`\{ kind: 'literal', value, directive: 'prose' \}`.
