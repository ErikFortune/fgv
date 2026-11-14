[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiCompletionUsage

# Interface: IAiCompletionUsage

Token accounting for a completion, normalized across providers.

## Remarks

Every field but `reports` is best-effort: a provider's wire shape reports
what it reports, and an absent field here means the corresponding wire
field was itself absent — never a guessed zero. See `reports` for the one
exception this rule has to be explicit about.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachedinputtokens"></a> `cachedInputTokens?` | `readonly` | `number` | Input tokens served from cache. |
| <a id="property-cachewritetokens"></a> `cacheWriteTokens?` | `readonly` | `number` | Input tokens written to cache. **Remarks** Two absence cases, disambiguated by `reports` — never by a `0` this field itself carries: - **`reports: 'reads-and-writes'` and this field absent** — the wire genuinely reported zero tokens written. Treat absence as `0`, not as unknown; this is the actionable "the breakpoint did not take" signal. - **`reports: 'reads'` and this field absent** — the API cannot report writes on this route at all (structurally unfillable, e.g. OpenAI/xAI Chat Completions). Never defaulted to `0` here — that would fabricate a fact the wire never stated. |
| <a id="property-outputtokens"></a> `outputTokens?` | `readonly` | `number` | Generated output tokens. |
| <a id="property-raw"></a> `raw?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | The provider's own usage block, unnormalized, for anything this shape drops. |
| <a id="property-reports"></a> `reports` | `readonly` | [`AiCacheReportingLevel`](../type-aliases/AiCacheReportingLevel.md) | What this response's wire shape *can* report about caching. **Remarks** **Required, not optional.** An optional field would make an absent `cacheWriteTokens` three-ways ambiguous — no write happened / this API cannot report writes / a build predating the field — and disambiguating exactly that is what this field exists for. Under `'reads-and-writes'`, an absent `cacheWriteTokens` genuinely means zero tokens were written this request — the actionable signal that a breakpoint did not take. Under `'reads'` it means the API cannot say, and inferring "zero writes" from it would be a fabricated fact. Same remedy as `IAiCompletionResponse.structuredOutput`. |
| <a id="property-totalinputtokens"></a> `totalInputTokens?` | `readonly` | `number` | Total input = uncached + cached, when both are known. |
| <a id="property-uncachedinputtokens"></a> `uncachedInputTokens?` | `readonly` | `number` | Input tokens **not** served from cache. Normalized — see `CAPABILITIES.md` for the per-provider table. |
