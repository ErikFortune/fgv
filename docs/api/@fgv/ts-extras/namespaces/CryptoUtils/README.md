[**@fgv Monorepo API Documentation**](../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../README.md) / [@fgv/ts-extras](../../README.md) / CryptoUtils

# CryptoUtils

Crypto utilities for encrypted file handling and key management.

## Namespaces

- [Constants](namespaces/Constants/README.md)
- [Converters](namespaces/Converters/README.md)
- [KeyStore](namespaces/KeyStore/README.md)

## Classes

- [DirectEncryptionProvider](classes/DirectEncryptionProvider.md)
- [HpkeProvider](classes/HpkeProvider.md)
- [NodeCryptoProvider](classes/NodeCryptoProvider.md)

## Interfaces

- [IArgon2idKeyDerivationParams](interfaces/IArgon2idKeyDerivationParams.md)
- [IArgon2idKeyingOptions](interfaces/IArgon2idKeyingOptions.md)
- [IArgon2idParams](interfaces/IArgon2idParams.md)
- [IArgon2idProvider](interfaces/IArgon2idProvider.md)
- [ICreateEncryptedFileParams](interfaces/ICreateEncryptedFileParams.md)
- [ICryptoProvider](interfaces/ICryptoProvider.md)
- [IDirectEncryptionProviderParams](interfaces/IDirectEncryptionProviderParams.md)
- [IEncryptBytesResult](interfaces/IEncryptBytesResult.md)
- [IEncryptedFile](interfaces/IEncryptedFile.md)
- [IEncryptionConfig](interfaces/IEncryptionConfig.md)
- [IEncryptionProvider](interfaces/IEncryptionProvider.md)
- [IEncryptionResult](interfaces/IEncryptionResult.md)
- [IHmacKeyOptions](interfaces/IHmacKeyOptions.md)
- [IHpkeSealResult](interfaces/IHpkeSealResult.md)
- [IKeyPairAlgorithmParams](interfaces/IKeyPairAlgorithmParams.md)
- [INamedSecret](interfaces/INamedSecret.md)
- [IPbkdf2KeyDerivationParams](interfaces/IPbkdf2KeyDerivationParams.md)
- [IWrapBytesOptions](interfaces/IWrapBytesOptions.md)
- [IWrappedBytes](interfaces/IWrappedBytes.md)

## Type Aliases

- [EncryptedFileErrorMode](type-aliases/EncryptedFileErrorMode.md)
- [EncryptedFileFormat](type-aliases/EncryptedFileFormat.md)
- [EncryptionAlgorithm](type-aliases/EncryptionAlgorithm.md)
- [IKeyDerivationParams](type-aliases/IKeyDerivationParams.md)
- [KeyDerivationFunction](type-aliases/KeyDerivationFunction.md)
- [KeyPairAlgorithm](type-aliases/KeyPairAlgorithm.md)
- [MultibaseSpkiPublicKey](type-aliases/MultibaseSpkiPublicKey.md)
- [SecretProvider](type-aliases/SecretProvider.md)
- [SeedDerivableAlgorithm](type-aliases/SeedDerivableAlgorithm.md)

## Variables

- [allKeyPairAlgorithms](variables/allKeyPairAlgorithms.md)
- [ARGON2ID\_OWASP\_MIN](variables/ARGON2ID_OWASP_MIN.md)
- [ARGON2ID\_PASSPHRASE](variables/ARGON2ID_PASSPHRASE.md)
- [keyPairAlgorithmParams](variables/keyPairAlgorithmParams.md)
- [MultibaseSpkiPublicKeyRegExp](variables/MultibaseSpkiPublicKeyRegExp.md)
- [nodeCryptoProvider](variables/nodeCryptoProvider.md)

## Functions

- [base64UrlNoPadDecode](functions/base64UrlNoPadDecode.md)
- [base64UrlNoPadEncode](functions/base64UrlNoPadEncode.md)
- [createEncryptedFile](functions/createEncryptedFile.md)
- [decryptFile](functions/decryptFile.md)
- [deriveKeyPairFromSeed](functions/deriveKeyPairFromSeed.md)
- [exportPublicKeyAsMultibaseSpki](functions/exportPublicKeyAsMultibaseSpki.md)
- [fromBase64](functions/fromBase64.md)
- [fromBase64Strict](functions/fromBase64Strict.md)
- [hexDecode](functions/hexDecode.md)
- [hexEncode](functions/hexEncode.md)
- [importPublicKeyFromMultibaseSpki](functions/importPublicKeyFromMultibaseSpki.md)
- [isEncryptedFile](functions/isEncryptedFile.md)
- [isValidMultibaseSpkiPublicKey](functions/isValidMultibaseSpkiPublicKey.md)
- [multibaseBase64UrlDecode](functions/multibaseBase64UrlDecode.md)
- [multibaseBase64UrlEncode](functions/multibaseBase64UrlEncode.md)
- [spkiToRawX25519](functions/spkiToRawX25519.md)
- [toBase64](functions/toBase64.md)
- [tryDecryptFile](functions/tryDecryptFile.md)
