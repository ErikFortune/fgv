[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-webauthn](../README.md) / PublicKeyCredentialRequestOptionsJSON

# Interface: PublicKeyCredentialRequestOptionsJSON

A variant of PublicKeyCredentialRequestOptions suitable for JSON transmission to the browser to
(eventually) get passed into navigator.credentials.get(...) in the browser.

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-allowcredentials"></a> `allowCredentials?` | `PublicKeyCredentialDescriptorJSON`[] |
| <a id="property-challenge"></a> `challenge` | `string` |
| <a id="property-extensions"></a> `extensions?` | `AuthenticationExtensionsClientInputs` |
| <a id="property-hints"></a> `hints?` | `PublicKeyCredentialHint`[] |
| <a id="property-rpid"></a> `rpId?` | `string` |
| <a id="property-timeout"></a> `timeout?` | `number` |
| <a id="property-userverification"></a> `userVerification?` | `UserVerificationRequirement` |
