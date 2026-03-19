[Home](../../README.md) > [Presentation](../README.md) > exportAllAsMarkdown

# Function: exportAllAsMarkdown

Exports all confections and non-built-in filling recipes to a single ZIP archive.

ZIP structure:
```
confections/{confectionType}/{confectionId}.md
fillings/{fillingId}.md
```

## Signature

```typescript
function exportAllAsMarkdown(confections: Iterable<AnyConfection>, fillings: Iterable<FillingRecipe>, options: IConfectionMarkdownOptions): Promise<Result<Uint8Array<ArrayBufferLike>>>
```
