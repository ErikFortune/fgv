[Home](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > generateKeyPair

## NodeCryptoProvider.generateKeyPair() method

Generates a new asymmetric keypair using Node's WebCrypto.

**Signature:**

```typescript
generateKeyPair(algorithm: KeyPairAlgorithm, extractable: boolean): Promise<Result<CryptoKeyPair>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>algorithm</td><td>KeyPairAlgorithm</td><td>The CryptoUtils.KeyPairAlgorithm | algorithm to use.</td></tr>
<tr><td>extractable</td><td>boolean</td><td>Whether the resulting keys may be exported.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;CryptoKeyPair&gt;&gt;

`Success` with the generated `CryptoKeyPair`, or `Failure` with an error.
