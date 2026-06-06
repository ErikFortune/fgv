[Home](../README.md) > [IArgon2idParams](./IArgon2idParams.md) > parallelism

## IArgon2idParams.parallelism property

Degree of parallelism (threads).
Note: WASM-based implementations compute sequentially regardless of this value,
but the value is wired into the algorithm and AFFECTS the output hash bytes.
Callers must use the same parallelism value consistently for a given secret.
Range: 1–255.

**Signature:**

```typescript
readonly parallelism: number;
```
