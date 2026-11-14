[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / PromptObservationPhase

# Type Alias: PromptObservationPhase

> **PromptObservationPhase** = `"resolve"` \| `"json-output"` \| `"free-text-output"` \| `"compose"`

The phase of the `PromptLibrary` call that produced an observation record.

## Remarks

`'resolve'` records come from [PromptLibrary.resolve](../classes/PromptLibrary.md#resolve) (and the inner
resolve of an output call). `'json-output'` / `'free-text-output'` records
come from [PromptLibrary.resolveJsonOutput](../classes/PromptLibrary.md#resolvejsonoutput) /
[PromptLibrary.resolveFreeTextOutput](../classes/PromptLibrary.md#resolvefreetextoutput) respectively and describe the
LLM output round-trip, cross-linked to their resolve record. `'compose'`
records come from [HorizontalComposer.compose](../classes/HorizontalComposer.md#compose) (when the composer is
wired to a [IPromptObservationSeam](../interfaces/IPromptObservationSeam.md)) and describe a multi-contributor
horizontal composition, nesting each contributor's resolve trace.
