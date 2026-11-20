[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-webauthn](../README.md) / startRegistration

# Function: startRegistration()

> **startRegistration**(`options`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistrationResponseJSON`](../interfaces/RegistrationResponseJSON.md)\>\>

Result-integration wrapper around `@simplewebauthn/browser`'s `startRegistration`.
Returns `Promise<Result<RegistrationResponseJSON>>`; upstream errors are captured
as `Failure` with the original message.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `optionsJSON`: [`PublicKeyCredentialCreationOptionsJSON`](../interfaces/PublicKeyCredentialCreationOptionsJSON.md); `useAutoRegister?`: `boolean`; \} |
| `options.optionsJSON` | [`PublicKeyCredentialCreationOptionsJSON`](../interfaces/PublicKeyCredentialCreationOptionsJSON.md) |
| `options.useAutoRegister?` | `boolean` |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`RegistrationResponseJSON`](../interfaces/RegistrationResponseJSON.md)\>\>

## See

https://simplewebauthn.dev/docs/packages/browser
