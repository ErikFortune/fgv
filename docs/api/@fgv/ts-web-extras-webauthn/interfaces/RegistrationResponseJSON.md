[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-webauthn](../README.md) / RegistrationResponseJSON

# Interface: RegistrationResponseJSON

A slightly-modified RegistrationCredential to simplify working with ArrayBuffers that
are Base64URL-encoded in the browser so that they can be sent as JSON to the server.

https://w3c.github.io/webauthn/#dictdef-registrationresponsejson

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-authenticatorattachment"></a> `authenticatorAttachment?` | `AuthenticatorAttachment` |
| <a id="property-clientextensionresults"></a> `clientExtensionResults` | `AuthenticationExtensionsClientOutputs` |
| <a id="property-id"></a> `id` | `string` |
| <a id="property-rawid"></a> `rawId` | `string` |
| <a id="property-response"></a> `response` | `AuthenticatorAttestationResponseJSON` |
| <a id="property-type"></a> `type` | `"public-key"` |
