[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / McpContentBlock

# Type Alias: McpContentBlock

> **McpContentBlock** = [`IMcpTextBlock`](../interfaces/IMcpTextBlock.md) \| [`IMcpResourceLinkBlock`](../interfaces/IMcpResourceLinkBlock.md) \| [`IMcpEmbeddedTextResourceBlock`](../interfaces/IMcpEmbeddedTextResourceBlock.md) \| [`IMcpEmbeddedBlobResourceBlock`](../interfaces/IMcpEmbeddedBlobResourceBlock.md) \| [`IMcpImageBlock`](../interfaces/IMcpImageBlock.md) \| [`IMcpAudioBlock`](../interfaces/IMcpAudioBlock.md) \| [`IMcpUnknownBlock`](../interfaces/IMcpUnknownBlock.md)

One content block of an MCP tool result, discriminated by `type`. Each is converter-validated;
anything that does not validate is an [IMcpUnknownBlock](../interfaces/IMcpUnknownBlock.md).

| MCP block | variant |
|---|---|
| `text` | [IMcpTextBlock](../interfaces/IMcpTextBlock.md) |
| `resource_link` | [IMcpResourceLinkBlock](../interfaces/IMcpResourceLinkBlock.md) |
| `resource` with `text` | [IMcpEmbeddedTextResourceBlock](../interfaces/IMcpEmbeddedTextResourceBlock.md) |
| `resource` with `blob` | [IMcpEmbeddedBlobResourceBlock](../interfaces/IMcpEmbeddedBlobResourceBlock.md) |
| `image` | [IMcpImageBlock](../interfaces/IMcpImageBlock.md) |
| `audio` | [IMcpAudioBlock](../interfaces/IMcpAudioBlock.md) |
| anything else, or malformed | [IMcpUnknownBlock](../interfaces/IMcpUnknownBlock.md) |

**Not carried:** a block's `annotations` (`audience`, `priority`, `lastModified`) and its `_meta`.
**Base64** (image, audio and blob `data`) is accepted in the standard or URL-safe alphabet, with
or without padding, and **without whitespace**: line-wrapped base64 (MIME style) is treated as
malformed, so such a block is [unknown](../interfaces/IMcpUnknownBlock.md).
