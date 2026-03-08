[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / AiPrompt

# Class: AiPrompt

A structured AI prompt with system/user split for direct API calls,
and a lazily-constructed combined version for copy/paste workflows.

## Constructors

### Constructor

> **new AiPrompt**(`user`, `system`): `AiPrompt`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `user` | `string` |
| `system` | `string` |

#### Returns

`AiPrompt`

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="system"></a> `system` | `readonly` | `string` | System instructions: schema documentation, format rules, general guidance. |
| <a id="user"></a> `user` | `readonly` | `string` | User request: the specific entity generation request. |

## Accessors

### combined

#### Get Signature

> **get** **combined**(): `string`

Combined single-string version (user + system joined) for copy/paste.

##### Returns

`string`
