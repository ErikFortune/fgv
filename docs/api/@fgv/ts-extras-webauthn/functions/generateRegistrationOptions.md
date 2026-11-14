[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-webauthn](../README.md) / generateRegistrationOptions

# Function: generateRegistrationOptions()

> **generateRegistrationOptions**(`options`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`PublicKeyCredentialCreationOptionsJSON`](../interfaces/PublicKeyCredentialCreationOptionsJSON.md)\>\>

Result-integration wrapper around `@simplewebauthn/server`'s `generateRegistrationOptions`.
Returns `Promise<Result<PublicKeyCredentialCreationOptionsJSON>>`; upstream errors are captured
as `Failure` with the original message.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `attestationType?`: `"direct"` \| `"none"` \| `"enterprise"`; `authenticatorSelection?`: `AuthenticatorSelectionCriteria`; `challenge?`: `string` \| `Uint8Array`\<`ArrayBuffer`\>; `excludeCredentials?`: `object`[]; `extensions?`: `AuthenticationExtensionsClientInputs`; `preferredAuthenticatorType?`: `"securityKey"` \| `"localDevice"` \| `"remoteDevice"`; `rpID`: `string`; `rpName`: `string`; `supportedAlgorithmIDs?`: `number`[]; `timeout?`: `number`; `userDisplayName?`: `string`; `userID?`: `Uint8Array`\<`ArrayBuffer`\>; `userName`: `string`; \} |
| `options.attestationType?` | `"direct"` \| `"none"` \| `"enterprise"` |
| `options.authenticatorSelection?` | `AuthenticatorSelectionCriteria` |
| `options.challenge?` | `string` \| `Uint8Array`\<`ArrayBuffer`\> |
| `options.excludeCredentials?` | `object`[] |
| `options.extensions?` | `AuthenticationExtensionsClientInputs` |
| `options.preferredAuthenticatorType?` | `"securityKey"` \| `"localDevice"` \| `"remoteDevice"` |
| `options.rpID` | `string` |
| `options.rpName` | `string` |
| `options.supportedAlgorithmIDs?` | `number`[] |
| `options.timeout?` | `number` |
| `options.userDisplayName?` | `string` |
| `options.userID?` | `Uint8Array`\<`ArrayBuffer`\> |
| `options.userName` | `string` |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`PublicKeyCredentialCreationOptionsJSON`](../interfaces/PublicKeyCredentialCreationOptionsJSON.md)\>\>

## See

https://simplewebauthn.dev/docs/packages/server
