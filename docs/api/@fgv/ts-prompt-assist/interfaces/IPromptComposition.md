[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptComposition

# Interface: IPromptComposition

Where a resolved prompt's bulk actually went: what is in the body, in what order, and how much of
it each part is.

## Remarks

Answers "why is this prompt so large", which the trace cannot — the trace says which bindings won,
not how many characters each contributed to the output. Sections carry the same provenance as
[IResolvedPromptSlot](IResolvedPromptSlot.md), so a large section is attributable to the scope and binding that
produced it without a second lookup.

**Offsets are computed during the render, never recovered from the finished text.** See
`MustacheTemplate.renderWithSegments` in `@fgv/ts-extras` for why searching the output for each
substituted value is unsound.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-cachefindings"></a> `cacheFindings` | `readonly` | readonly [`IPromptCacheFinding`](IPromptCacheFinding.md)[] | Prompt-cache stability diagnostics for this composition — see `design.md` §9 (checks D1–D5) and [PromptCacheFindingKind](../type-aliases/PromptCacheFindingKind.md). Findings report problems only; a wholly cacheable, well-ordered, above-threshold prefix produces an empty array, not a success entry. Always `[]` when [IPromptComposition.unavailable](#property-unavailable) is set — there is no section map to analyze. **Remarks** Purely computational: no provider is consulted, nothing is emitted, and this array cannot affect what `resolve()` returns for `body`. |
| <a id="property-sections"></a> `sections` | `readonly` | readonly [`IPromptSection`](IPromptSection.md)[] | Document-ordered, contiguous and gapless — concatenating the slices reproduces `body` exactly. **Empty when [IPromptComposition.unavailable](#property-unavailable) is set.** |
| <a id="property-totalchars"></a> `totalChars` | `readonly` | `number` | Length of [IResolvedPrompt.body](IResolvedPrompt.md#property-body) in UTF-16 code units. Always present. |
| <a id="property-totalmeasured"></a> `totalMeasured?` | `readonly` | `number` | Sum of the sections' `measured`, when a measure was supplied. |
| <a id="property-unavailable"></a> `unavailable?` | `readonly` | `string` | Set when a section map could not be produced — e.g. the body template uses Mustache sections or partials, whose output is not a linear image of the template. **Remarks** A diagnostic must not be able to break the thing it observes, so this is reported here rather than failing the resolve. The prompt is returned normally; only the section map is missing, and it says why rather than being silently absent. |
