[Home](../README.md) > HpkeProvider

# Class: HpkeProvider

HPKE base mode (RFC 9180) — `DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM`.

Class-based provider that captures a `SubtleCrypto` instance at construction,
matching the existing `NodeCryptoProvider` / `BrowserCryptoProvider` / `KeyStore`
factory pattern used throughout `@fgv/ts-extras/crypto-utils`.

**Node.js usage:**
```typescript
import * as crypto from 'crypto';
const hpke = HpkeProvider.create(crypto.webcrypto.subtle).orThrow();
```

**Browser usage:**
```typescript
const hpke = HpkeProvider.create(globalThis.crypto.subtle).orThrow();
```

**Runtime requirements:** Node.js 20+ (X25519 in `crypto.webcrypto`);
Chrome 113+, Safari 16.4+, Firefox 118+ (X25519 added to Web Crypto in 2023).

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

[create(subtle)](./HpkeProvider.create.md)

</td><td>

`static`

</td><td>

Creates an `HpkeProvider` bound to the given `SubtleCrypto` instance.

</td></tr>
<tr><td>

[encodeEnvelope(result)](./HpkeProvider.encodeEnvelope.md)

</td><td>

`static`

</td><td>

Encodes an IHpkeSealResult as a single contiguous byte array for wire transport.

</td></tr>
<tr><td>

[decodeEnvelope(envelope)](./HpkeProvider.decodeEnvelope.md)

</td><td>

`static`

</td><td>

Decodes an envelope produced by HpkeProvider.encodeEnvelope.

</td></tr>
<tr><td>

[sealBase(recipientPublicKey, info, aad, plaintext)](./HpkeProvider.sealBase.md)

</td><td>



</td><td>

HPKE base-mode seal (sender side).

</td></tr>
<tr><td>

[openBase(recipientPrivateKey, info, aad, enc, ciphertext)](./HpkeProvider.openBase.md)

</td><td>



</td><td>

HPKE base-mode open (recipient side).

</td></tr>
<tr><td>

[hkdf(secret, salt, info, length)](./HpkeProvider.hkdf.md)

</td><td>



</td><td>

HKDF-SHA256 key derivation (RFC 5869).

</td></tr>
</tbody></table>
