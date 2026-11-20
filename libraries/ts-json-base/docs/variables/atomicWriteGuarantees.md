[Home](../README.md) > atomicWriteGuarantees

# Variable: atomicWriteGuarantees

Every FileTree.AtomicWriteGuarantee | atomic write guarantee, ordered
weakest to strongest, so a consumer can rank one against another.

## Type

`readonly ["session", "process-crash", "os-crash", "power-loss"]`
