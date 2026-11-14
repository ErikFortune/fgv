[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-webauthn](../README.md) / startAuthentication

# Function: startAuthentication()

> **startAuthentication**(`options`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`AuthenticationResponseJSON`](../interfaces/AuthenticationResponseJSON.md)\>\>

Result-integration wrapper around `@simplewebauthn/browser`'s `startAuthentication`.
Returns `Promise<Result<AuthenticationResponseJSON>>`; upstream errors are captured
as `Failure` with the original message.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `optionsJSON`: [`PublicKeyCredentialRequestOptionsJSON`](../interfaces/PublicKeyCredentialRequestOptionsJSON.md); `useBrowserAutofill?`: `boolean`; `verifyBrowserAutofillInput?`: `boolean`; \} |
| `options.optionsJSON` | [`PublicKeyCredentialRequestOptionsJSON`](../interfaces/PublicKeyCredentialRequestOptionsJSON.md) |
| `options.useBrowserAutofill?` | `boolean` |
| `options.verifyBrowserAutofillInput?` | `boolean` |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`AuthenticationResponseJSON`](../interfaces/AuthenticationResponseJSON.md)\>\>

## See

https://simplewebauthn.dev/docs/packages/browser
