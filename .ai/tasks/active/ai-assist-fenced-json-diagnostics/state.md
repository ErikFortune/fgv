# State — `ai-assist-fenced-json-diagnostics`

## Base

Brief named `release @ b689c99ca`. `origin/release` had already advanced to
`fbb08cd55` ("deps: repair root rush shim lockfile; bump @microsoft/rush to
5.178.0 (#575)") by the time this stream started. Branched from current
`origin/release` per the brief's "branch from release" instruction. No conflict
with the stream's files.

## Decisions

### D1 — Standalone classifier, not a change to `fencedStringifiedJson`

The parse step lives inside `JsonBaseConverters.stringifiedJson`, which this
stream does not own, and `Converter<T>.convert` returns `Result<T>` — a string
message, with no channel for typed detail. Three shapes were considered:

1. A `DetailedResult`-returning parse entry point. Rejected: `Converter` cannot
   carry detail, so this would need a parallel non-Converter pipeline and a
   consumer rewrite.
2. An `onParseFailure?: (reason) => void` diagnostics hook on
   `IFencedStringifiedJsonExtractorOptions`. Rejected: a void side-channel
   callback fits poorly with Result discipline, and it forces a change to the
   converter path — the exact place the brief says not to regress.
3. **A standalone `classifyJsonParseFailure(text)` the caller invokes on the
   failure path.** Chosen. Purely additive, zero risk to existing messages, and
   it gives the consumer exactly the branch they asked for at the cost of one
   extra line at the call site.

Consequence: `fencedStringifiedJson` and `extractJsonText` behaviour is
**byte-identical** to before. The only behavioural surface added is the new
export.

### D2 — Structural scanner, never `error.message`

The brief forbids scraping the engine message when the case is structurally
determinable. It is, for all four cases, so the classifier never calls
`JSON.parse` at all and never reads an `Error`. `scanForParseFailure` walks the
JSON grammar with an explicit `value` / `name` / `colon` / `comma` expectation
plus a container stack, and reports the first fault it can name. Verdicts are
therefore stable across Node/V8 versions by construction.

### D3 — Case 3 (unterminated name) needs a guard, and gets one

Surprise: `{ "key: 1 }` never reaches `JSON.parse`. `findBalancedJsonSubstring`
treats the trailing `}` as *inside* the unterminated string, so the extractor
returns `'unclosed'` and fails with the **#573 truncation message**. So case 3
is intercepted upstream of the parse path entirely.

The classifier still handles it, because it scans the candidate from the
opening `{` regardless of whether the extractor found a balanced substring
(hence the added `start` field on the `'found'`/`'unclosed'` arms of the
internal `BalancedJsonScanResult`).

But an unterminated string at name position is genuinely ambiguous with a
mid-name truncation (`{ "descripti`). The conservative discriminator adopted:
classify as `'unterminated-property-name'` **only when the swallowed body
contains a `:`** — text the author plainly meant as the name/value separator.
Without a `:`, return `'unknown'`. This is the one arm with a documented
heuristic; it is stated plainly in the TSDoc and in `result.md`.

An unterminated string at *value* position is never classified (it is the
truncation shape), which is a structural distinction, not a heuristic.

### D4 — Deliberately NOT classified

Kept in the catch-all on purpose, to avoid scope creep and false confidence:

- **Trailing comma** (`{ "a": 1, }`) — falls out of the scanner naturally and
  would be highly confident, but it is not one of the four named cases. Noted
  as a natural follow-on rather than shipped.
- **Missing colon** (`{ "a" 1 }`), **value elision** (`{ "a": , }`), bad number
  literals, duplicate keys.
- **Truncation** — already diagnosed by the extractor; the classifier
  deliberately does not compete with it.

### D5 — `offset` is against the caller's original `text`

Rather than against the extracted substring, so a consumer can slice/point at
the original model output directly. Making that exact required capturing the
opening fence as its own group, so `FENCED_BLOCK` gained a group: it is now
`/(```[A-Za-z0-9_-]*\s*\r?\n)([\s\S]*?)\r?\n?```/` and `extractJsonText` reads
`fenced[2]` instead of `fenced[1]`. Behaviour of `extractJsonText` is
unchanged; only the group index moved. Existing fence tests cover this.

### D6 — Array elision included

`[1, , 2]` is the same structural signal as the object case and equally
confident, so `'elided-member'` covers both. The brief named only the
property-name position; including arrays is free and documented.

### D7 — `locateJsonCandidate` is the single source of truth (post-review)

Initially `extractJsonText`'s strip-wrappers preamble and the classifier's
offset-base computation were two independent implementations of the same step.
The `code-reviewer` pass flagged this as its only P2: they agree today, but
nothing enforces that they stay in sync, and a desync would silently point a
classified `offset` into text the extractor never parsed.

Resolved by extracting `locateJsonCandidate(text): { stripped, text, base }`,
used by both. `stripped` is on the result specifically so `extractJsonText` can
keep its two distinct failure messages in the original order (empty input →
"input is empty"; non-empty input with an empty fenced body → "no JSON content
found") without recomputing the BOM/trim step.

## Gates

(filled in at exit — see `result.md`)
