[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-webauthn](../README.md) / VerifiedRegistrationResponse

# Type Alias: VerifiedRegistrationResponse

> **VerifiedRegistrationResponse** = \{ `registrationInfo?`: `never`; `verified`: `false`; \} \| \{ `registrationInfo`: \{ `aaguid`: `string`; `attestationObject`: `Uint8Array_`; `authenticatorExtensionResults?`: `AuthenticationExtensionsAuthenticatorOutputs`; `credential`: [`WebAuthnCredential`](WebAuthnCredential.md); `credentialBackedUp`: `boolean`; `credentialDeviceType`: `CredentialDeviceType`; `credentialType`: `"public-key"`; `fmt`: `AttestationFormat`; `origin`: `string`; `rpID?`: `string`; `userVerified`: `boolean`; \}; `verified`: `true`; \}

Result of registration verification

## Param

**verified**

If the assertion response could be verified

## Param

**registrationInfo.fmt**

Type of attestation

## Param

**registrationInfo.counter**

The number of times the authenticator reported it has been used.
**Should be kept in a DB for later reference to help prevent replay attacks!**

## Param

**registrationInfo.aaguid**

Authenticator's Attestation GUID indicating the type of the
authenticator

## Param

**registrationInfo.credentialPublicKey**

The credential's public key

## Param

**registrationInfo.credentialID**

The credential's credential ID for the public key above

## Param

**registrationInfo.credentialType**

The type of the credential returned by the browser

## Param

**registrationInfo.userVerified**

Whether the user was uniquely identified during attestation

## Param

**registrationInfo.attestationObject**

The raw `response.attestationObject` Buffer returned by
the authenticator

## Param

**registrationInfo.credentialDeviceType**

Whether this is a single-device or multi-device
credential. **Should be kept in a DB for later reference!**

## Param

**registrationInfo.credentialBackedUp**

Whether or not the multi-device credential has been
backed up. Always `false` for single-device credentials. **Should be kept in a DB for later
reference!**

## Param

**registrationInfo.origin**

The origin of the website that the registration occurred on

## Param

**registrationInfo?.rpID**

The RP ID that the registration occurred on, if one or more were
specified in the registration options

## Param

**registrationInfo?.authenticatorExtensionResults**

The authenticator extensions returned
by the browser
