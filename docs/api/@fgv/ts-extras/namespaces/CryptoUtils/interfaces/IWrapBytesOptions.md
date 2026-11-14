[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / IWrapBytesOptions

# Interface: IWrapBytesOptions

Caller-supplied HKDF parameters that domain-separate one
[wrapBytes](ICryptoProvider.md#wrapbytes) call from another.
Two wraps that share recipient but differ on `salt` or `info` derive distinct
wrap keys, so callers should pick values that bind the wrap to its
application context (e.g. a content hash for `salt` and a secret name for
`info`).

Both fields are required; pass an empty `Uint8Array` if the caller has no
value to bind on a given axis. Silent defaulting would hide protocol
mistakes, so the API does not pick defaults.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-info"></a> `info` | `readonly` | `Uint8Array` | HKDF info. Further binds the derived key to a specific use within the calling application. Caller picks; common choices include a secret name, message type, or version tag. |
| <a id="property-salt"></a> `salt` | `readonly` | `Uint8Array` | HKDF salt. Domain-separates this wrap from others in different contexts. Caller picks; common choices include a content hash, document id, channel id, etc. |
