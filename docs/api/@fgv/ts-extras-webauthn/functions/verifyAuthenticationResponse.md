[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-webauthn](../README.md) / verifyAuthenticationResponse

# Function: verifyAuthenticationResponse()

> **verifyAuthenticationResponse**(`options`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`VerifiedAuthenticationResponse`](../type-aliases/VerifiedAuthenticationResponse.md)\>\>

Result-integration wrapper around `@simplewebauthn/server`'s `verifyAuthenticationResponse`.
Returns `Promise<Result<VerifiedAuthenticationResponse>>`; upstream errors are captured
as `Failure` with the original message.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `advancedFIDOConfig?`: \{ `userVerification?`: `UserVerificationRequirement`; \}; `credential`: [`WebAuthnCredential`](../type-aliases/WebAuthnCredential.md); `expectedChallenge`: `string` \| ((`challenge`) => `boolean` \| `Promise`\<`boolean`\>); `expectedOrigin`: `string` \| `string`[]; `expectedRPID`: `string` \| `string`[]; `expectedType?`: `string` \| `string`[]; `requireUserVerification?`: `boolean`; `response`: [`AuthenticationResponseJSON`](../interfaces/AuthenticationResponseJSON.md); \} |
| `options.advancedFIDOConfig?` | \{ `userVerification?`: `UserVerificationRequirement`; \} |
| `options.advancedFIDOConfig.userVerification?` | `UserVerificationRequirement` |
| `options.credential` | [`WebAuthnCredential`](../type-aliases/WebAuthnCredential.md) |
| `options.expectedChallenge` | `string` \| ((`challenge`) => `boolean` \| `Promise`\<`boolean`\>) |
| `options.expectedOrigin` | `string` \| `string`[] |
| `options.expectedRPID` | `string` \| `string`[] |
| `options.expectedType?` | `string` \| `string`[] |
| `options.requireUserVerification?` | `boolean` |
| `options.response` | [`AuthenticationResponseJSON`](../interfaces/AuthenticationResponseJSON.md) |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`VerifiedAuthenticationResponse`](../type-aliases/VerifiedAuthenticationResponse.md)\>\>

## See

https://simplewebauthn.dev/docs/packages/server
