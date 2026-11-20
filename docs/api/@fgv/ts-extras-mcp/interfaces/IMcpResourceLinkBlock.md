[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpResourceLinkBlock

# Interface: IMcpResourceLinkBlock

A `resource_link` content block: a resource the server points at without embedding it.

## Remarks

**The package never follows the link.** The `uri` is server-supplied, and fetching it is the
consumer's decision; any fetch must go through the consumer's own egress guard (for an
`http(s)` URI, `@fgv/ts-extras`' `SaferFetch.saferFetchBytes`, or `SaferFetch.createGuardedFetch`
for a streamed body), never a plain `fetch`.
`uri`, `name`, `title` and `mimeType` are each one printable line; an optional one that is not
is dropped, and a `uri` that is not makes the whole block [unknown](IMcpUnknownBlock.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `readonly` | `string` | A human-readable description; free text, possibly several lines. |
| <a id="property-mimetype"></a> `mimeType?` | `readonly` | `string` | The resource's MIME type, when the server gave one. |
| <a id="property-name"></a> `name?` | `readonly` | `string` | The resource's programmatic name. |
| <a id="property-title"></a> `title?` | `readonly` | `string` | The resource's display title. |
| <a id="property-type"></a> `type` | `readonly` | `"resource_link"` | - |
| <a id="property-uri"></a> `uri` | `readonly` | `string` | The resource's URI. Not followed by this package. |
