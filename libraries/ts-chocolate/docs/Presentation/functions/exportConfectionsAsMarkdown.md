[Home](../../README.md) > [Presentation](../README.md) > exportConfectionsAsMarkdown

# Function: exportConfectionsAsMarkdown

Exports all confections in the iterable to a ZIP archive of Markdown files.

ZIP structure: `{confectionType}/{confectionId}.md`

## Signature

```typescript
function exportConfectionsAsMarkdown(confections: Iterable<AnyConfection>, options: IConfectionMarkdownOptions): Promise<Result<Uint8Array<ArrayBufferLike>>>
```
