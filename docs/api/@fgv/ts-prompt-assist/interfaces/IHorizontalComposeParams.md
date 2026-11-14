[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IHorizontalComposeParams

# Interface: IHorizontalComposeParams

Parameters for [HorizontalComposer.create](../classes/HorizontalComposer.md#create).

## Remarks

Lives in the `composition` packlet (rather than alongside the other
composition types in the `types` packlet) because its optional
[observation](#property-observation) field references
[IPromptObservationSeam](IPromptObservationSeam.md) from the `observe` packlet — and the `types`
packlet is a leaf that `observe` depends on, so it cannot depend back on
`observe`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-composedbody"></a> `composedBody` | `readonly` | `string` | Mustache body template for the composed prompt, referencing logical slots by name (`{{logicalSlotName}}`). [IPromptDescriptor](IPromptDescriptor.md) carries slot declarations but not a body (a body lives on candidate records, not the descriptor), so the composed body template is supplied here. Rendered with the merged slot map via the same `MustacheTemplateCache` (`escape: 'none'`) the resolver uses. |
| <a id="property-composeddescriptor"></a> `composedDescriptor` | `readonly` | [`IPromptDescriptor`](IPromptDescriptor.md) | Descriptor for the composed prompt. Mandatory so [HorizontalComposer](../classes/HorizontalComposer.md) can run `applySafeguards` against a first-class composed descriptor (the composed slots' `maxLength` / `allowedDirectives` / safeguard overrides) before returning a body — this is the safety closure the consumer-side external-composer path cannot achieve. Its `slots` are the logical-slot declarations (keyed by `logicalSlotName`). |
| <a id="property-contributors"></a> `contributors` | `readonly` | readonly [`IContributorSpec`](IContributorSpec.md)[] | Independently-resolved contributors, each tagged with a composer-layer provenance. |
| <a id="property-logicalslots"></a> `logicalSlots` | `readonly` | readonly [`ILogicalSlotConfig`](ILogicalSlotConfig.md)[] | The logical-slot declarations. Declared order is a tiebreaker for topo-equal slots, **not** the semantic processing order — independent logical slots may be processed in any order. (Phase B+1 replaces the declared-order walk with a dependency topo-sort; treating declared order as the binding processing order would make that a breaking change.) |
| <a id="property-observation"></a> `observation?` | `readonly` | [`IPromptObservationSeam`](IPromptObservationSeam.md) | Optional observation seam obtained from [PromptLibrary.observationSeam](../classes/PromptLibrary.md#observationseam). When supplied, [HorizontalComposer.compose](../classes/HorizontalComposer.md#compose) times the merge, builds a `'compose'` observation record (nesting each contributor's resolve trace), and awaits its dispatch through the library's observer fan-out before returning — so an audit trail correlates the composed output with the N contributor `'resolve'` records via the shared `seq` space. When omitted, `compose` behaves exactly as before with zero observation overhead. |
| <a id="property-safetypolicy"></a> `safetyPolicy?` | `readonly` | [`IPromptSafetyPolicy`](IPromptSafetyPolicy.md) | Optional safety policy applied (with the composed descriptor) to the merged slot values. |
