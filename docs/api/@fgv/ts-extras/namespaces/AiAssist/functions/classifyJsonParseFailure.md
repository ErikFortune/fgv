[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / classifyJsonParseFailure

# Function: classifyJsonParseFailure()

> **classifyJsonParseFailure**(`text`): [`JsonParseFailureReason`](../type-aliases/JsonParseFailureReason.md)

Classifies why a JSON-shaped LLM response would not parse, returning a
[AiAssist.JsonParseFailureReason](../type-aliases/JsonParseFailureReason.md) a caller can branch on — repair the
cheap cases, re-prompt the expensive ones, fail outright on the rest —
instead of regex-matching an engine-specific `JSON.parse` message.

Pass the same raw model text you handed
[AiAssist.fencedStringifiedJson](fencedStringifiedJson.md) or [AiAssist.extractJsonText](../variables/extractJsonText.md);
this applies the same BOM / whitespace / fence / preamble handling before
scanning, and reports `offset` against that original text.

Classification is **structural and deliberately conservative**. The scan
walks the JSON grammar itself rather than reading the engine's error string,
so its verdicts are stable across Node versions — and any fault it cannot
name with confidence comes back as `'unknown'` rather than a guess. In
particular an input that opened a structure and never closed it (the
truncated-response shape [AiAssist.extractJsonText](../variables/extractJsonText.md) already diagnoses)
classifies as `'unknown'` here; the two diagnostics are complementary, not
competing.

This never fails and never repairs — it only names the fault. It is a
diagnostic on the failure path, so calling it on text that parses fine is
harmless but pointless: it returns `'unknown'`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `text` | `string` | Raw model output (the same string handed to the extractor). |

## Returns

[`JsonParseFailureReason`](../type-aliases/JsonParseFailureReason.md)

A [AiAssist.JsonParseFailureReason](../type-aliases/JsonParseFailureReason.md).

## Example

```ts
const parsed = fencedStringifiedJson({ inner }).convert(raw);
if (parsed.isFailure()) {
  const reason = classifyJsonParseFailure(raw);
  switch (reason.kind) {
    case 'unquoted-property-name': // cheap to repair
    case 'single-quoted-property-name':
      break;
    case 'elided-member':
    case 'unterminated-property-name': // worth a re-prompt
      break;
    default: // 'unknown' — fail outright
  }
}
```
