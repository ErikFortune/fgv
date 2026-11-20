[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskPromptThreshold

# Interface: ITaskPromptThreshold

Whether the stable prefix is long enough to cache, as far as the composition can say.

## Remarks

- `unknown` — no tokenizer, or no minimum, was supplied: the size was not judged. Neither a
  failure nor evidence that the prefix caches.
- `below` — measured and judged short of the supplied minimum: the plan is sound, but a provider
  will not cache a prefix this short.
- `met` — measured and judged at or above the supplied minimum.

None of these is a claim about provider cache hits; the check never consults a provider.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-detail"></a> `detail?` | `readonly` | `string` | prompt-assist's own description, for `unknown` and `below`. |
| <a id="property-verdict"></a> `verdict` | `readonly` | `"unknown"` \| `"below"` \| `"met"` | - |
