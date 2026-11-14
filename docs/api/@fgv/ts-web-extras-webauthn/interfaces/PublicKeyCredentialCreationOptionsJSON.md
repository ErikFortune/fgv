[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-webauthn](../README.md) / PublicKeyCredentialCreationOptionsJSON

# Interface: PublicKeyCredentialCreationOptionsJSON

A variant of PublicKeyCredentialCreationOptions suitable for JSON transmission to the browser to
(eventually) get passed into navigator.credentials.create(...) in the browser.

This should eventually get replaced with official TypeScript DOM types when WebAuthn L3 types
eventually make it into the language:

https://w3c.github.io/webauthn/#dictdef-publickeycredentialcreationoptionsjson

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-attestation"></a> `attestation?` | `AttestationConveyancePreference` |
| <a id="property-attestationformats"></a> `attestationFormats?` | `AttestationFormat`[] |
| <a id="property-authenticatorselection"></a> `authenticatorSelection?` | `AuthenticatorSelectionCriteria` |
| <a id="property-challenge"></a> `challenge` | `string` |
| <a id="property-excludecredentials"></a> `excludeCredentials?` | `PublicKeyCredentialDescriptorJSON`[] |
| <a id="property-extensions"></a> `extensions?` | `AuthenticationExtensionsClientInputs` |
| <a id="property-hints"></a> `hints?` | `PublicKeyCredentialHint`[] |
| <a id="property-pubkeycredparams"></a> `pubKeyCredParams` | `PublicKeyCredentialParameters`[] |
| <a id="property-rp"></a> `rp` | `PublicKeyCredentialRpEntity` |
| <a id="property-timeout"></a> `timeout?` | `number` |
| <a id="property-user"></a> `user` | `PublicKeyCredentialUserEntityJSON` |
