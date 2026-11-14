[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-ollama](../README.md) / IOllamaChatMessage

# Interface: IOllamaChatMessage

A chat message in Ollama native shape.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-content"></a> `content` | `readonly` | `string` | The message text. |
| <a id="property-images"></a> `images?` | `readonly` | readonly `string`[] | Base64 image data for vision models (no `data:` prefix). |
| <a id="property-role"></a> `role` | `readonly` | `"system"` \| `"user"` \| `"assistant"` \| `"tool"` | The message role. |
