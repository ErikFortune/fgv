[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-webauthn](../README.md) / VerifiedAuthenticationResponse

# Type Alias: VerifiedAuthenticationResponse

> **VerifiedAuthenticationResponse** = `object`

Result of authentication verification

## Param

**verified**

If the authentication response could be verified

## Param

**authenticationInfo.credentialID**

The ID of the authenticator used during authentication.
Should be used to identify which DB authenticator entry needs its `counter` updated to the value
below

## Param

**authenticationInfo.newCounter**

The number of times the authenticator identified above
reported it has been used. **Should be kept in a DB for later reference to help prevent replay
attacks!**

## Param

**authenticationInfo.credentialDeviceType**

Whether this is a single-device or multi-device
credential. **Should be kept in a DB for later reference!**

## Param

**authenticationInfo.credentialBackedUp**

Whether or not the multi-device credential has been
backed up. Always `false` for single-device credentials. **Should be kept in a DB for later
reference!**

## Param

**authenticationInfo.origin**

The origin of the website that the authentication occurred on

## Param

**authenticationInfo.rpID**

The RP ID that the authentication occurred on

## Param

**authenticationInfo?.authenticatorExtensionResults**

The authenticator extensions returned
by the browser

## Properties

### authenticationInfo

> **authenticationInfo**: `object`

| Name | Type |
| ------ | ------ |
| `authenticatorExtensionResults?` | `AuthenticationExtensionsAuthenticatorOutputs` |
| `credentialBackedUp` | `boolean` |
| `credentialDeviceType` | `CredentialDeviceType` |
| `credentialID` | `Base64URLString` |
| `newCounter` | `number` |
| `origin` | `string` |
| `rpID` | `string` |
| `userVerified` | `boolean` |

***

### verified

> **verified**: `boolean`
