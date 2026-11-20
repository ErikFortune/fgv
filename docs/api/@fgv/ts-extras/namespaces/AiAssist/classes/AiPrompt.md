[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AiPrompt

# Class: AiPrompt

A structured AI prompt with system/user split for direct API calls,
and a lazily-constructed combined version for copy/paste workflows.

## Constructors

### Constructor

> **new AiPrompt**(`user`, `system`, `attachments?`): `AiPrompt`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `user` | `string` |
| `system` | `string` |
| `attachments?` | readonly [`IAiImageAttachment`](../interfaces/IAiImageAttachment.md)[] |

#### Returns

`AiPrompt`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-attachments"></a> `attachments` | `public readonly` | readonly [`IAiImageAttachment`](../interfaces/IAiImageAttachment.md)[] | Optional image attachments. When present, vision-capable providers will include them in the user message; non-vision providers will reject the call up front (see [AiAssist.IAiProviderDescriptor.acceptsImageInput](../interfaces/IAiProviderDescriptor.md#property-acceptsimageinput)). |
| <a id="property-system"></a> `system` | `public readonly` | `string` | System instructions: schema documentation, format rules, general guidance. |
| <a id="property-user"></a> `user` | `public readonly` | `string` | User request: the specific entity generation request. |

## Accessors

### combined

#### Get Signature

> **get** **combined**(): `string`

Combined single-string version (user + system joined) for copy/paste.
When attachments are present, includes a sentinel noting they aren't
part of the copied text.

##### Returns

`string`

## Methods

### toRequest()

> **toRequest**(): [`IChatRequest`](../interfaces/IChatRequest.md)

Lowers this prompt to the unified [AiAssist.IChatRequest](../interfaces/IChatRequest.md) shape consumed
by the turn entry points (`callProviderCompletion`,
`callProviderCompletionStream`, `generateJsonCompletion`,
`executeClientToolTurn`). The prompt becomes a single current `user` turn
(carrying any attachments) with the system instructions in the distinct
`system` field.

#### Returns

[`IChatRequest`](../interfaces/IChatRequest.md)
