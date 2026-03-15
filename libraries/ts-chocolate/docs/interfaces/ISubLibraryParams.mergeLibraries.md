[Home](../README.md) > [ISubLibraryParams](./ISubLibraryParams.md) > mergeLibraries

## ISubLibraryParams.mergeLibraries property

Existing libraries to merge collections from.

Collections are extracted from these libraries and merged with
builtin, file source, and explicit collections. Collection ID
collisions across any sources cause an error.

Can be:
- A single library (merges all collections)
- An `IMergeLibrarySource` object with optional filtering
- An array of the above

**Signature:**

```typescript
readonly mergeLibraries: SubLibraryMergeSource<TLibrary> | readonly SubLibraryMergeSource<TLibrary>[];
```
