[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpToolAnnotations

# Interface: IMcpToolAnnotations

Normalized MCP `Tool.annotations` — the five known host-advisory behavior hints.

## Remarks

Field names mirror MCP's `ToolAnnotations` 1:1 (and map straight onto
`AiAssist.IAiToolAnnotations`). Per the MCP spec these are hints only, and per the
untrusted-server warning they are validated/normalized (known fields kept, malformed
or unknown fields dropped) before they reach [IMcpToolDescriptor](IMcpToolDescriptor.md) — the raw
server blob is never propagated.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-destructivehint"></a> `destructiveHint?` | `readonly` | `boolean` | Hint: the tool may perform destructive updates (only meaningful when not read-only). |
| <a id="property-idempotenthint"></a> `idempotentHint?` | `readonly` | `boolean` | Hint: repeated calls with the same arguments have no additional effect. |
| <a id="property-openworldhint"></a> `openWorldHint?` | `readonly` | `boolean` | Hint: the tool interacts with an open world of external entities. |
| <a id="property-readonlyhint"></a> `readOnlyHint?` | `readonly` | `boolean` | Hint: the tool does not modify its environment (read-only). |
| <a id="property-title"></a> `title?` | `readonly` | `string` | Optional human-readable display title for the tool. Kept only when it is one printable line (no control characters, U+2028 or U+2029); otherwise dropped, never altered. |
