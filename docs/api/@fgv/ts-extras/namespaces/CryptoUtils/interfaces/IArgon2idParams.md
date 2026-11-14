[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / IArgon2idParams

# Interface: IArgon2idParams

Parameters for Argon2id key derivation (RFC 9106).
All fields are required; fgv does not pick defaults silently.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-iterations"></a> `iterations` | `readonly` | `number` | Number of passes (iterations / time cost). OWASP 2023 minimum: 2. Range: \>= 1. |
| <a id="property-memorykib"></a> `memoryKiB` | `readonly` | `number` | Memory cost in kibibytes (KiB). OWASP 2023 minimum: 19456 (19 MiB). Stronger: 65536 (64 MiB). Constraint: \>= 8. |
| <a id="property-outputbytes"></a> `outputBytes` | `readonly` | `number` | Number of output bytes (hash length). Typical values: 16 (128-bit), 32 (256-bit, AES-256 key), 64 (512-bit). Constraint: \>= 4. |
| <a id="property-parallelism"></a> `parallelism` | `readonly` | `number` | Degree of parallelism (threads). Note: WASM-based implementations compute sequentially regardless of this value, but the value is wired into the algorithm and AFFECTS the output hash bytes. Callers must use the same parallelism value consistently for a given secret. Range: 1–255. |
