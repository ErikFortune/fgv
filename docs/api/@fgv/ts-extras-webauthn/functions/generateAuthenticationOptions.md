[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-webauthn](../README.md) / generateAuthenticationOptions

# Function: generateAuthenticationOptions()

> **generateAuthenticationOptions**(`options`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`PublicKeyCredentialRequestOptionsJSON`](../interfaces/PublicKeyCredentialRequestOptionsJSON.md)\>\>

Result-integration wrapper around `@simplewebauthn/server`'s `generateAuthenticationOptions`.
Returns `Promise<Result<PublicKeyCredentialRequestOptionsJSON>>`; upstream errors are captured
as `Failure` with the original message.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `allowCredentials?`: `object`[]; `challenge?`: `string` \| `Uint8Array`\<`ArrayBuffer`\>; `extensions?`: `AuthenticationExtensionsClientInputs`; `rpID`: `string`; `timeout?`: `number`; `userVerification?`: `"discouraged"` \| `"preferred"` \| `"required"`; \} |
| `options.allowCredentials?` | `object`[] |
| `options.challenge?` | `string` \| `Uint8Array`\<`ArrayBuffer`\> |
| `options.extensions?` | `AuthenticationExtensionsClientInputs` |
| `options.rpID` | `string` |
| `options.timeout?` | `number` |
| `options.userVerification?` | `"discouraged"` \| `"preferred"` \| `"required"` |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`PublicKeyCredentialRequestOptionsJSON`](../interfaces/PublicKeyCredentialRequestOptionsJSON.md)\>\>

## See

https://simplewebauthn.dev/docs/packages/server
