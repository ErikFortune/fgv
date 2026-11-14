[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiToolAnnotations

# Interface: IAiToolAnnotations

Behavior annotations for a client-defined tool.

## Remarks

These are **host-advisory-only hints** describing a tool's side-effect profile.
They are consumed by the host's tool loop (e.g. a before-execute gate) and are
**never serialized to the model** — the provider wire tool-schemas whitelist
`{name, description, parameters}` and ignore this field.

Field names mirror MCP's `ToolAnnotations` (`@modelcontextprotocol/sdk`) 1:1 so
an MCP tool's annotations pass through unchanged. Per the MCP spec, all fields
are hints — a host should never make tool-use decisions based on annotations
received from an untrusted server without its own validation.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-destructivehint"></a> `destructiveHint?` | `readonly` | `boolean` | Hint: the tool may perform destructive updates (only meaningful when not read-only). |
| <a id="property-idempotenthint"></a> `idempotentHint?` | `readonly` | `boolean` | Hint: repeated calls with the same arguments have no additional effect. |
| <a id="property-openworldhint"></a> `openWorldHint?` | `readonly` | `boolean` | Hint: the tool interacts with an open world of external entities. |
| <a id="property-readonlyhint"></a> `readOnlyHint?` | `readonly` | `boolean` | Hint: the tool does not modify its environment (read-only). |
| <a id="property-title"></a> `title?` | `readonly` | `string` | Optional human-readable display title for the tool. |
