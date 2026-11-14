[Home](../README.md) > [ResourceManagerBuilder](./ResourceManagerBuilder.md) > getAllBuiltCandidates

## ResourceManagerBuilder.getAllBuiltCandidates() method

Gets a read-only array of all Resources.Resource | built resources in the manager.

**Signature:**

```typescript
getAllBuiltCandidates(): Result<readonly ResourceCandidate[]>;
```

**Returns:**

Result&lt;readonly [ResourceCandidate](ResourceCandidate.md)[]&gt;

`Success` with an array of resources if successful, or `Failure` with an error message if not.
