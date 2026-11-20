[Home](../../README.md) > [ResourceJson](../README.md) > mergeImporterCandidate

# Function: mergeImporterCandidate

Helper method to merge a resource candidate with a base name and conditions from import context.
This function enables name inheritance for resource candidates, similar to resources.

## Signature

```typescript
function mergeImporterCandidate(candidate: IImporterResourceCandidateDecl, baseName: string, baseConditions: readonly ILooseConditionDecl<string>[]): Result<IImporterResourceCandidateDecl>
```
