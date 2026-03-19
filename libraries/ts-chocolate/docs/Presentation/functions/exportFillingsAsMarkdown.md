[Home](../../README.md) > [Presentation](../README.md) > exportFillingsAsMarkdown

# Function: exportFillingsAsMarkdown

Exports all non-built-in filling recipes to a ZIP archive of Markdown files.

ZIP structure: `{fillingId}.md` (flat, since filling IDs are already namespaced)

## Signature

```typescript
function exportFillingsAsMarkdown(fillings: Iterable<FillingRecipe>): Promise<Result<Uint8Array<ArrayBufferLike>>>
```
