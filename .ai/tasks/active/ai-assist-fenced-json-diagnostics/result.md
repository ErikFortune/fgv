# Result — `ai-assist-fenced-json-diagnostics`

**Status:** complete. P3 / opportunistic; no consumer was blocked.

## What shipped

One new `@public` export pair on `@fgv/ts-extras`'s `AiAssist` surface:

```ts
type JsonParseFailureReason =
  | { readonly kind: 'unquoted-property-name';       readonly token: string; readonly offset: number }
  | { readonly kind: 'single-quoted-property-name';  readonly token: string; readonly offset: number }
  | { readonly kind: 'unterminated-property-name';   readonly token: string; readonly offset: number }
  | { readonly kind: 'elided-member';                readonly token: string; readonly offset: number }
  | { readonly kind: 'unknown' };

function classifyJsonParseFailure(text: string): JsonParseFailureReason;
```

Intended use is on the failure path:

```ts
const parsed = fencedStringifiedJson({ inner }).convert(raw);
if (parsed.isFailure()) {
  switch (classifyJsonParseFailure(raw).kind) { /* repair | re-prompt | fail */ }
}
```

Files: `libraries/ts-extras/src/packlets/ai-assist/jsonResponse.ts` (implementation),
`.../ai-assist/index.ts` (two exports), `etc/ts-extras.api.md` (regenerated),
`src/test/unit/ai-assist/jsonParseDiagnostics.test.ts` (new), plus a Rush change file.

## Classification strategy

**Structural, never engine-message-derived.** The classifier does not call `JSON.parse`
and never reads an `Error.message`. It preprocesses the input exactly as
`extractJsonText` does (BOM strip, trim, fence unwrap), finds the first `{`/`[`
outside a quoted string, then walks the JSON grammar with an explicit
`value` / `name` / `colon` / `comma` expectation plus a container stack, reporting the
first fault it can name. Verdicts are therefore stable across Node/V8 versions by
construction, which was the brief's central constraint.

`offset` is a 0-based index into the **original** `text` argument, not the extracted
substring. A test helper (`expectOffsetPointsAtToken`) asserts
`text.charAt(reason.offset) === reason.token.charAt(0)` on every classified case,
including the BOM, preamble, fence, and fence-plus-indent variants — so the offset
arithmetic is pinned by an invariant, not by hand-computed constants alone.

## What could be classified confidently — all four named cases

| Case | Input | Verdict |
|---|---|---|
| 1. unquoted key | `{ key: 1 }` | `unquoted-property-name`, token `key`, offset 2 |
| 2. single-quoted key | `{ 'key': 1 }` | `single-quoted-property-name`, token `'key'`, offset 2 |
| 3. unterminated name | `{ "key: 1 }` | `unterminated-property-name`, token `"key: 1 }`, offset 2 |
| 4. elision | `{ , "key": 1 }`, `{ "a":1, , "b":2 }` | `elided-member`, token `,` |

Array elision (`[1, , 2]`, `[, 1]`) is included as well — structurally identical to the
object case and equally confident. The brief named only the property-name position;
covering arrays was free.

## Limits of the strategy (read this before trusting a verdict)

**Case 3 carries the only heuristic, and it is deliberately narrow.** Two surprises
shaped it:

1. `{ "key: 1 }` **never reaches `JSON.parse`.** `findBalancedJsonSubstring` treats the
   trailing `}` as *inside* the unterminated string, so `extractJsonText` fails first
   with the PR #573 truncation message. The classifier still handles the case because it
   scans from the opening `{` whether or not a balanced substring was found.
2. An unterminated string at a name position is genuinely ambiguous with a mid-name
   truncation (`{ "descripti`). The adopted discriminator: classify as
   `unterminated-property-name` **only when the swallowed body contains a `:`** — text the
   author plainly meant as the name/value separator. Without a `:`, return `unknown`. An
   unterminated string at a *value* position is never classified (that is the truncation
   shape) — a structural distinction, not a heuristic.

Both limits are stated in the TSDoc.

## Deliberately left in the catch-all

Not guesses, not oversights — each would have been a scope expansion or a false-confidence
risk:

- **Truncation** — already named by `extractJsonText`; the classifier does not compete.
- **Trailing comma** (`{ "a": 1, }`) — falls out of the scanner and would be highly
  confident, but it is not one of the four named cases. The most natural follow-on if the
  consumer wants a fifth kind.
- **Missing colon** (`{"a" 1}`), **missing comma** (`{"a":1 "b":2}`), **elided value**
  (`{"a": , }`), **mismatched delimiter** (`{"a": [1, 2}`).
- **Smart quotes** (typographic `“key”`) — not an identifier start, so `unknown` rather
  than a wrong `unquoted-property-name`.
- **Non-ASCII unquoted names** (`{ ключ: 1 }`) — identifier recognition is ASCII-only;
  documented in the TSDoc and pinned by a test.
- **Unquoted array values** (`[a, b]`) — not a property-name position.
- `NaN` / `Infinity` literals, bad number literals, duplicate keys.

## What stayed unchanged (verified, not asserted)

`extractJsonText` and `fencedStringifiedJson` are behaviourally identical. The PR #573
truncation message and the generic "no JSON-shaped substring found" message both have
dedicated regression tests, alongside a test pinning `fencedStringifiedJson`'s raw
`failed to parse json` propagation.

The one behaviour-adjacent edit is the `FENCED_BLOCK` regex, regrouped so the opening
fence is group 1 and the body group 2. This was needed to map a body offset back onto the
original text exactly. Equivalence was proven by a 6804-input fuzz over language tags,
separators, CRLF, empty bodies, backtick-containing bodies, BOM/preamble prefixes and
multi-fence suffixes: old group 1 ≡ new group 2, with identical match index and matched
text, and group 1 always exactly the match prefix.

`extractJsonText`'s strip-wrappers preamble now routes through the shared
`locateJsonCandidate` (the layer-1 P2 fix) rather than inlining BOM/trim/fence handling.
Its two failure messages and their order are preserved exactly; the shared helper returns
`stripped` alongside `text` specifically so the "input is empty" vs "no JSON content
found" distinction survives the extraction.

## Layer-1 review (`code-reviewer` on the diff)

**APPROVED — no P1 blockers.** No `any`, no unsafe-cast type checks, no
Result-pattern violation, termination of the `for(;;)` scan verified. All five
brief constraints independently verified, including an adversarial probe that
found no confidently-wrong verdict.

| Finding | Disposition |
|---|---|
| **P2** — `extractJsonText`'s strip-wrappers preamble and the classifier's offset-base computation were two independent implementations of the same step; nothing enforced they stay in sync | **Fixed.** Extracted `locateJsonCandidate(text) → { stripped, text, base }`, used by both. `stripped` is on the result so `extractJsonText` keeps its two distinct failure messages in the original order without recomputing BOM/trim. |
| **P3-1** — the ~99.96% coverage gap at the single-quote token ternary is reachable and intentional, not a branch to eliminate | **Fixed.** Closed with a real scenario test (`{ 'key: 1 }`), not a directive. Coverage now 100% with no `c8 ignore`. |
| **P3-2** — `IDENTIFIER_START`/`PART` are ASCII-only, so `{ ключ: 1 }` reports `'unknown'` | **Applied.** Noted in the `JsonParseFailureReason` TSDoc and pinned by a test. Behaviour unchanged — it is the conservative-by-design outcome. |
| **P3-3** — a fenced body containing a literal triple backtick mis-slices (lazy `[\s\S]*?` stops early); confirmed **pre-existing**, inherited bit-for-bit | **Dispositioned + logged.** Out of scope for this stream; new `docs/TECH_DEBT.md` P3 entry with trigger, scope sketch, and the note that the classifier degrades to `'unknown'` rather than compounding it. |
| **P3-4** — the offset-invariant helper wasn't called from three tests | **Applied.** `expectOffsetPointsAtToken` now runs on every classified case. |

The reviewer independently confirmed the design call that
`classifyJsonParseFailure` should **not** return `Result<T>` — it is total, with
`'unknown'` as an explicit floor, so wrapping it would mirror the `Result<void>`
anti-pattern.

## Gates

| Gate | Result |
|---|---|
| `rushx build` (`libraries/ts-extras`) | pass |
| `rushx lint` | pass, clean |
| `rushx fixlint` + `prettier` | run before the final commit |
| `rushx test` | 2046 passing, 0 failing |
| Coverage | statements / branches / functions / lines all **100%** |
| `rush build --to @fgv/ts-prompt-assist` | pass |
| `etc/ts-extras.api.md` | regenerated |
| Rush change file | added (`minor`) |
| No `any` | confirmed |

Layer-1 ordering was honoured: scenario-driven tests first, `code-reviewer` on the diff
before the coverage-closure pass, then the single remaining branch closed with a real
scenario test (`{ 'key: 1 }` — an unterminated single-quoted name), not a directive. No
`c8 ignore` directives were added.

## Notes for the orchestrator

- `etc/ts-extras.api.md` will conflict with the sibling `ai-assist-alias-capability-guard`
  stream; resolve by rebuilding, as anticipated in the brief.
- This stream added one `docs/TECH_DEBT.md` P3 entry (the pre-existing fence/backtick
  mis-slice), at the reviewer's request. `docs/WORKSTREAMS.md` was not touched.
- The new `{@link AiAssist.*}` references bake `ae-unresolved-link` warnings into the API
  report. This is the file's established behaviour for namespace-scoped links (298 such
  warnings predate this change, including on `extractJsonText` itself) — sibling-consistent,
  and not the cross-package case the review checklist prohibits.
- Base was `origin/release` @ `fbb08cd55`, not the `b689c99ca` named in the brief;
  `release` had already advanced. No overlap with the stream's surface.

## Left undone

Nothing from the brief. The trailing-comma kind is the one obvious additive follow-on, and
is intentionally deferred rather than forgotten.
