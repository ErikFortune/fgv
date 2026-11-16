[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptDescriptor

# Interface: IPromptDescriptor

Locked prompt descriptor shape (design §3.9).

## Remarks

The design's expectation is one descriptor per prompt id — same shape
across every scope where the id appears, with per-scope variation
living in [IStoredPromptRecord.candidates](IStoredPromptRecord.md#property-candidates) (qualifier-conditional
bodies) and in scope-level [IScopeSlotBindingsRecord](IScopeSlotBindingsRecord.md) files.

The library enforces this only on `describe()`: when called, it walks
every scope carrying the id and rejects mismatches via RFC 8785
canonical-JSON comparison. `resolve()` does NOT cross-check — it
walks the chain and uses the first record it finds. Authors who
publish divergent descriptors across scopes therefore get a clean
failure from `describe()` but a silent first-match win from
`resolve()`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | Optional longer-form description for editor surfaces. |
| <a id="property-examples"></a> `examples?` | `readonly` | readonly [`IPromptExampleSet`](IPromptExampleSet.md)[] | Optional example pairs grouped by qualifier-condition scope. |
| <a id="property-id"></a> `id` | `readonly` | [`PromptId`](../type-aliases/PromptId.md) | Branded prompt id. Must equal the filename stem in disk-backed stores. |
| <a id="property-join"></a> `join?` | `readonly` | [`IPromptJoinPolicy`](IPromptJoinPolicy.md) | Optional join policy for partial-candidate fragments. |
| <a id="property-output"></a> `output` | `readonly` | [`PromptOutputContract`](../type-aliases/PromptOutputContract.md) | Output contract — `'free-text'` or `'json'` (with a registered Converter). |
| <a id="property-outputvalidations"></a> `outputValidations?` | `readonly` | readonly [`ValidatorId`](../type-aliases/ValidatorId.md)[] | Ordered list of validator ids run by `resolveJsonOutput` after the `output.converterId` converts the raw response. Validators must be registered in the library's [IPromptRegistry](IPromptRegistry.md) and their `appliesTo` must include the response kind produced by `output.converterId`'s Converter. The store / descriptor file loader does NOT have access to the registry, so this contract is enforced at `PromptLibrary.describe()` / `resolve()` time (and cached per descriptor). Only valid when `output.kind === 'json'`; the descriptor file loader does reject `outputValidations` on `'free-text'` descriptors at load time. |
| <a id="property-qualifiers"></a> `qualifiers?` | `readonly` | [`IPromptQualifierMetadata`](IPromptQualifierMetadata.md) | Optional ts-res qualifier-axis hints (required / expected / disallowed). |
| <a id="property-safeguards"></a> `safeguards?` | `readonly` | [`IPromptSafeguardOverrides`](IPromptSafeguardOverrides.md) | Optional per-descriptor safeguard overrides. |
| <a id="property-schemaversion"></a> `schemaVersion` | `readonly` | `"1"` | Schema version. Only `'1'` is supported in v0.1. |
| <a id="property-slots"></a> `slots` | `readonly` | readonly [`IPromptSlot`](IPromptSlot.md)[] | Slot declarations. Each slot is referenced by `\{\{\{name\}\}\}` in candidate bodies. |
| <a id="property-surface"></a> `surface` | `readonly` | `string` | Open string identifying the rendering target (e.g. `'chat'`, `'completion'`, `'embed'`). v0.1 ships no per-consumer descriptor- Converter hook; the built-in `descriptorConverter` accepts any non-empty string. Consumers needing stricter narrowing can post-validate after `describe()` / per-record `store.get()`. |
| <a id="property-title"></a> `title` | `readonly` | `string` | Human-readable title surfaced to authoring tools. |
