[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-webauthn](../README.md) / verifyRegistrationResponse

# Function: verifyRegistrationResponse()

> **verifyRegistrationResponse**(`options`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`VerifiedRegistrationResponse`](../type-aliases/VerifiedRegistrationResponse.md)\>\>

Result-integration wrapper around `@simplewebauthn/server`'s `verifyRegistrationResponse`.
Returns `Promise<Result<VerifiedRegistrationResponse>>`; upstream errors are captured
as `Failure` with the original message.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `attestationSafetyNetEnforceCTSCheck?`: `boolean`; `expectedChallenge`: `string` \| ((`challenge`) => `boolean` \| `Promise`\<`boolean`\>); `expectedOrigin`: `string` \| `string`[]; `expectedRPID?`: `string` \| `string`[]; `expectedType?`: `string` \| `string`[]; `requireUserPresence?`: `boolean`; `requireUserVerification?`: `boolean`; `response`: [`RegistrationResponseJSON`](../interfaces/RegistrationResponseJSON.md); `supportedAlgorithmIDs?`: `number`[]; \} |
| `options.attestationSafetyNetEnforceCTSCheck?` | `boolean` |
| `options.expectedChallenge` | `string` \| ((`challenge`) => `boolean` \| `Promise`\<`boolean`\>) |
| `options.expectedOrigin` | `string` \| `string`[] |
| `options.expectedRPID?` | `string` \| `string`[] |
| `options.expectedType?` | `string` \| `string`[] |
| `options.requireUserPresence?` | `boolean` |
| `options.requireUserVerification?` | `boolean` |
| `options.response` | [`RegistrationResponseJSON`](../interfaces/RegistrationResponseJSON.md) |
| `options.supportedAlgorithmIDs?` | `number`[] |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`VerifiedRegistrationResponse`](../type-aliases/VerifiedRegistrationResponse.md)\>\>

## See

https://simplewebauthn.dev/docs/packages/server
