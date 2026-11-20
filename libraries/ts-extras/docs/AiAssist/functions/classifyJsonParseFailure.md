[Home](../../README.md) > [AiAssist](../README.md) > classifyJsonParseFailure

# Function: classifyJsonParseFailure

Classifies why a JSON-shaped LLM response would not parse, returning a
AiAssist.JsonParseFailureReason a caller can branch on — repair the
cheap cases, re-prompt the expensive ones, fail outright on the rest —
instead of regex-matching an engine-specific `JSON.parse` message.

Pass the same raw model text you handed
AiAssist.fencedStringifiedJson or AiAssist.extractJsonText;
this applies the same BOM / whitespace / fence / preamble handling before
scanning, and reports `offset` against that original text.

Classification is **structural and deliberately conservative**. The scan
walks the JSON grammar itself rather than reading the engine's error string,
so its verdicts are stable across Node versions — and any fault it cannot
name with confidence comes back as `'unknown'` rather than a guess. In
particular an input that opened a structure and never closed it (the
truncated-response shape AiAssist.extractJsonText already diagnoses)
classifies as `'unknown'` here; the two diagnostics are complementary, not
competing.

This never fails and never repairs — it only names the fault. It is a
diagnostic on the failure path, so calling it on text that parses fine is
harmless but pointless: it returns `'unknown'`.

## Signature

```typescript
function classifyJsonParseFailure(text: string): JsonParseFailureReason
```
