[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / supportsCacheUsageReporting

# Function: supportsCacheUsageReporting()

> **supportsCacheUsageReporting**(`descriptor`): `boolean`

Whether a provider has confirmed prompt-cache-relevant `usage` reporting on
the shared Chat Completions / Responses completion paths (streaming and
non-streaming alike).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) |

## Returns

`boolean`

## Remarks

The completion paths it gates — `callOpenAiCompletion`,
`callOpenAiResponsesCompletion`, the Responses streaming adapter, and
`executeClientToolTurn`'s direct Responses call — are shared by every
`apiFormat: 'openai'` descriptor — xAI Grok, Groq, Mistral, Ollama, and self-hosted
`openai-compat` all route through the same adapter as OpenAI. Only OpenAI
and xAI Grok are confirmed to report cache-relevant `usage` fields; an
ordinary `usage` block from one of the other descriptors (e.g. Groq's plain
`prompt_tokens` / `completion_tokens`, with no cache sub-object at all)
carries no cache information. Normalizing it anyway would stamp
`reports: 'reads'` on a provider that has no prompt-caching concept —
a false cache-reporting signal, not an absent one. So this gate is checked
before every normalize call it governs; when it's `false`, `usage` stays
absent entirely rather than being guessed from whatever shape the wire
happens to send.

**Streaming Chat Completions is gated by a different predicate.** That path
consults [AiAssist.supportsStreamUsageOption](supportsStreamUsageOption.md) instead, because the
request has to opt in via `stream_options: { include_usage: true }` before
there is any usage to normalize — and that opt-in is `'openai'`-only, since
the other descriptors' tolerance for the unrecognized field is unverified.
The practical consequence is that xAI Grok, which *is* confirmed here, still
gets no `usage` on streaming Chat Completions. If you are tracing a missing
xAI streaming figure, that predicate is the one to read, not this one.
