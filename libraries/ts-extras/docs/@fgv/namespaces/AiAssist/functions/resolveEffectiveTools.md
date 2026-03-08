[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / resolveEffectiveTools

# Function: resolveEffectiveTools()

> **resolveEffectiveTools**(`descriptor`, `settingsTools?`, `perCallTools?`): readonly [`IAiWebSearchToolConfig`](../interfaces/IAiWebSearchToolConfig.md)[]

Resolves the effective tools for a completion call.

- If per-call tools are provided, they override settings-level tools entirely.
- Otherwise, settings-level enabled tools are used.
- Only tools supported by the provider are included.
- Returns an empty array if no tools are enabled (= no tools sent).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor (used to filter by supported tools) |
| `settingsTools?` | readonly [`IAiToolEnablement`](../interfaces/IAiToolEnablement.md)[] | Tool enablement from provider settings (optional) |
| `perCallTools?` | readonly [`IAiWebSearchToolConfig`](../interfaces/IAiWebSearchToolConfig.md)[] | Per-call tool override (optional) |

## Returns

readonly [`IAiWebSearchToolConfig`](../interfaces/IAiWebSearchToolConfig.md)[]

The resolved list of tool configs to include in the request
