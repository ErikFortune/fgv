[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptCacheStability

# Type Alias: PromptCacheStability

> **PromptCacheStability** = `"frozen"` \| `"per-conversation"` \| `"per-request"`

How often a section of a prompt changes between requests.

## Remarks

A closed, total-ordered set of exactly three levels —
`'frozen' > 'per-conversation' > 'per-request'` — because that is the full
set of distinctions any known prompt-cache mechanism can act on: a
breakpoint is placed *between* levels, and a cache is either shared or
conversation-scoped. See `design.md` §3 for why a fourth level would buy
nothing until a provider exposes a scoping axis that needs it.

The governing asymmetry (`design.md` §1): a false `'per-request'` costs a
discount not taken; a false `'frozen'` costs the entire prefix, on every
request, silently. From it: **the default is `'per-request'`**, and a
stability claim may only ever be downgraded, never upgraded (R-b).
