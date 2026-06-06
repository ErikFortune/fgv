[Home](../../README.md) > [CryptoUtils](../README.md) > IWrapBytesOptions

# Interface: IWrapBytesOptions

Caller-supplied HKDF parameters that domain-separate one
CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes call from another.
Two wraps that share recipient but differ on `salt` or `info` derive distinct
wrap keys, so callers should pick values that bind the wrap to its
application context (e.g. a content hash for `salt` and a secret name for
`info`).

Both fields are required; pass an empty `Uint8Array` if the caller has no
value to bind on a given axis. Silent defaulting would hide protocol
mistakes, so the API does not pick defaults.

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[salt](./IWrapBytesOptions.salt.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

HKDF salt.

</td></tr>
<tr><td>

[info](./IWrapBytesOptions.info.md)

</td><td>

`readonly`

</td><td>

Uint8Array

</td><td>

HKDF info.

</td></tr>
</tbody></table>
