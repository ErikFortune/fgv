[Home](../../README.md) > [CryptoUtils](../README.md) > IArgon2idProvider

# Interface: IArgon2idProvider

Argon2id key derivation provider (RFC 9106).

Implementations are in separate packages to avoid WASM bundle costs for
consumers who don't need Argon2id:
- Node: `@fgv/ts-extras-argon2` (`NodeArgon2Provider`)
- Browser: `@fgv/ts-web-extras-argon2` (`BrowserArgon2Provider`)

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[argon2id(password, salt, params)](./IArgon2idProvider.argon2id.md)

</td><td>



</td><td>

Derives key material from a password using Argon2id (RFC 9106 §3.1).

</td></tr>
</tbody></table>
