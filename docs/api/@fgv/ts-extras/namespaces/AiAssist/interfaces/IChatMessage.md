[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IChatMessage

# Interface: IChatMessage

A single chat message in OpenAI format.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-attachments"></a> `attachments?` | `readonly` | readonly [`IAiImageAttachment`](IAiImageAttachment.md)[] | Optional image attachments. Only honoured on the **current turn** (the last message of an [AiAssist.IChatRequest](IChatRequest.md)); vision-capable providers include them in that user message, non-vision providers reject the call up front (see [AiAssist.IAiProviderDescriptor.acceptsImageInput](IAiProviderDescriptor.md#property-acceptsimageinput)). Attachments on history (non-final) messages are ignored. |
| <a id="property-content"></a> `content` | `readonly` | `string` | Message content |
| <a id="property-role"></a> `role` | `readonly` | `"user"` \| `"system"` \| `"assistant"` | Message role |
