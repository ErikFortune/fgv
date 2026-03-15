[Home](../../README.md) > [Session](../README.md) > toSessionSlug

# Function: toSessionSlug

Normalizes a string to a kebab-case slug suitable for use in a session ID.

- German umlauts are expanded (ä→ae, ö→oe, ü→ue) and ß becomes ss.
- Apostrophes and similar punctuation are stripped (so "Bailey's" → "baileys").
- Remaining non-alphanumeric runs become hyphens.
- Leading/trailing hyphens are trimmed.

## Signature

```typescript
function toSessionSlug(input: string): string | undefined
```
