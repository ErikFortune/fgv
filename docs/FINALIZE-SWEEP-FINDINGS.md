# Finalize-sweep findings — items needing a human decision

**What this is.** A retroactive `/finalize-task` sweep over the stream corpus, closing the
gap between stream directories on disk and narrated entries in `docs/WORKSTREAMS.md`. Each
stream gets a `meta.yaml`, an antagonist pass that tries to refute it, and — where the
stream is genuinely un-narrated — a drafted ledger entry.

Most of what the sweep produces is bookkeeping and needs no attention. **This file is the
exception list**: things the sweep found that a person should decide, ordered by what looks
most likely to matter. It exists so the decisions are in one place rather than scattered
across six PR bodies.

**Started 2026-08-14.** Sweep scope: 22 completed streams with no ledger entry, plus a
triage of 9 `active/` streams that may be shipped-but-never-migrated.

> **Nothing here has been acted on.** Every item is a finding, not a change. Where the
> sweep *did* change something (a `meta.yaml`, a README amendment, a `TECH_DEBT.md` entry),
> that is in the PR diff and is not repeated here.

---

## Ordering

1. **Correctness / security** — something in shipped code may be wrong
2. **Unmet commitments** — a binding decision or acceptance criterion that was not met
3. **Lost work** — deferrals, lessons, and open questions recorded nowhere durable
4. **Bookkeeping decisions** — ledger shape, naming, what deserves an entry

---

## 1. Correctness / security

### 1.1 `argon2` is pinned below its own binding floor — `crypto-batch-2-argon2id`

`brief-phase-b.md` D1 set **`argon2` v0.45.0+** as binding ("where it conflicts with
`design.md`, this brief wins"). `libraries/ts-extras-argon2/package.json` ships
`"argon2": "~0.44.0"` — a tilde range that can never resolve to 0.45.0 or above. The pin
*style* also diverged from the signed-off design, which specified caret ranges (`^0.45.0`,
`^4.12.0`) reasoning that caret admits non-breaking patch and minor updates; both new
packages shipped tilde. Neither the version miss nor the style change is explained in any
artifact — `state.md` records "v0.44.0" matter-of-factly.

This compounds with D4, which made **ongoing version-sync fgv's responsibility** for a
memory-hard KDF on the grounds that fgv should concentrate the risk rather than have each
consumer re-derive it. `design.md` §8 proposed a cadence (quarterly `rush update` +
changelog review; immediate review on a security advisory). None of it was operationalized:
`docs/TECH_DEBT.md` does not mention argon2, `docs/FUTURE.md` carries only a later
unrelated API-surface ask, and `.github/dependabot.yml` is a generic weekly npm config that
predates the stream and names neither library.

**Decision needed:** whether to move the pin to the intended floor, and whether D4's
obligation gets an artifact or is formally dropped. An accepted standing obligation with no
artifact is indistinguishable from one nobody took.

---

## 2. Unmet commitments

### 2.1 HPKE browser coverage was 95%+ against a binding 100% criterion — `crypto-batch-2-hpke`

`brief-phase-b.md` required 100% coverage in **both** `ts-extras` and `ts-web-extras`.
PR #348's own description states "100% coverage in ts-extras; 95%+ in ts-web-extras". The
shortfall was disclosed at the time and then carried into no completion record — the
stream's README states 100% only on the Node row and is silent on the browser row, which
is accurate but reads as omission rather than distinction.

**Decision needed:** close the gap, or accept and record it. Low urgency — the package has
been in production use since. Flagged because it is a *binding criterion that was not met
and then went unrecorded*, which is the pattern worth catching, more than because 95% is
alarming.

### 2.2 A design's stated precondition was never discharged — `ai-assist-image-generation`

`design.md` Q9 asks for a specific action before the breaking `quality: 'high'` → `'hd'`
change could be called zero-cost: *"grep `personaility` and `ts-app-shell` for any usage of
`quality`… verify quality field usage in consumer repos before accepting the migration path
as zero-cost."* No artifact records that this was done — not the phase-B brief, not the
README, not the ledger — while `state.md` reports open questions as "(none)". The blanket
"none" is what buried it.

**Decision needed:** run the check now (cheap), or accept that the migration shipped
unverified and close the question. It has been months and no consumer breakage surfaced,
which is weak evidence it was fine.

---

## 3. Lost work

### 3.1 A TECH_DEBT trigger fired without the debt being paid — `ai-assist-image-generation`

The P3 entry (`resolveImageCapability` returning `| undefined` rather than `Result`) carries
the trigger "next substantive change to the provider registry or capability resolution
path". That trigger fired: #516 changed that very function to resolve `@aliases` before
prefix-matching. The debt was not paid, and the entry's line reference is now stale
(`registry.ts:328-339`; the function sits at 428-433).

Its sibling P2 was properly paid off by #619 and removed — so the mechanism works; this one
just was not noticed.

**Decision needed:** pay it, or re-trigger it with a sharper condition. Also worth asking
whether "next time this file is touched" is a workable trigger shape at all, given it
depends on whoever touches the file having read the debt ledger first.

### 3.2 Two lessons were surfaced in stream artifacts and never filed

Filed during this sweep as **L31** (audit response fixtures when parsing gets stricter,
from `ai-assist-thinking-config`) and **L32** (a polished design can be correct on
inventory and wrong on architecture — trust the signoff gate, from
`ai-assist-image-generation`, which recurred on its sibling stream).

No decision needed — recorded here because the *pattern* is the finding: in both cases
three of the stream's four lessons reached `lessons-pending.md` and one did not, with
nothing to catch the drop.

### 3.3 `lessons-pending.md` L1 has been open ~3 months

The parallel-phase-A lesson surfaced by `ai-assist-thinking-config` is captured but
uncodified; the most recent sweep took L38–L40 and did not reach it.

**Decision needed:** codify or close. Flagged because a pending-lessons file that
accumulates faster than it drains stops being a queue and becomes an archive.

---

## 4. Bookkeeping decisions

### 4.1 The ledger gap is 31, not the "~25" previously recorded

Measured 2026-08-14 as a set difference on stream ids: **68 directories, 41 ledger entries,
31 directories with no entry under their own name, 20 of those unmentioned entirely.** The
earlier figure was wrong twice over — `grep -c '^### '` counted two prose section headings
as streams, and subtracting totals instead of taking a set difference cancelled naming
mismatches against real gaps. Corrected in `WORKSTREAMS.md`, the `task-corpus-index` brief,
and the skill (whose step 8 had prescribed the naive count).

### 4.2 Some "gaps" are naming mismatches, not gaps

Confirmed so far: directory `ts-prompt-assist` is narrated as **`ts-prompt-assist-features`**;
directory `safer-fetch-s3` is narrated under **`fetch-primitive-threat-model`** (as its S3
sub-stream). These will be reported as un-narrated by any tool matching on id until either
the directory or the entry is renamed.

**Decision needed:** rename directories to match entries, rename entries to match
directories, or record the mapping (this sweep adds a `ledgerEntry:` field to `meta.yaml`
for the affected streams, which is the no-churn option).

### 4.3 Does every stream deserve a ledger entry?

The ledger is explicitly curated — "the ones worth narrating" — so 41-of-68 is partly by
design, not purely neglect. Several gap streams are one-file fixes whose own entry would
add noise. Where the sweep judges that, it drafts a sentence to fold into the parent
stream's entry instead, and says so.

**Decision needed:** confirm that judgment call is yours to make per-stream, or give a rule
(e.g. "anything with its own PR gets an entry").

---

## Batch 1 — `ks-encoding`, `result-should-not-fail`, `ts-prompt-assist`, `ai-assist-client-tools`, `ai-assist-client-tool-id-fix`

### B1.1 — a public `@fgv/ts-utils` method is documented nowhere authoritative

`Result<T>.shouldNotFail(label?, frameDepth?)` shipped in #400 on the repo's
most-depended-on library. `grep shouldNotFail` returns **zero hits** in
`.ai/instructions/CODING_STANDARDS.md` and **zero** in
`.ai/instructions/LIBRARY_CAPABILITIES.md` — verified. `CODING_STANDARDS.md` §
"Extracting Values" still documents only `orThrow` / `orDefault` / `orDefaultLazy`; the
`ts-utils` base-packlet row in the capabilities guide never names it. It is discoverable
only from the `/result-pattern` skill.

The capabilities guide opens with *"Before writing new utility code, scan this guide. If a
capability is listed here, use the existing library — do not reimplement it."* A method
absent from it is, by the guide's own logic, a method that will be reimplemented.

**Decision needed:** both are instruction-file edits, which the skill holds back from
auto-commit. Drafts are ready — say the word and they go in. Suggested shape: a bullet in
§ "Extracting Values" positioning `.shouldNotFail()` for declaration-time sites, and a
clause on the `base` row of the capabilities table.

### B1.2 — `@fgv/ks` still hand-rolls hex; the primitive now exists

`tools/ks/src/encoding.ts:29` uses `Buffer.from(bytes).toString('hex')`. The stream's own
`result.md` justified that: *"there is no fgv-canonical hex primitive."* True when written
(#425, 2026-05-27). `CryptoUtils.hexEncode` / `hexDecode` landed in #554 (2026-07-18) and
are in `etc/ts-extras.api.md`. So this is now a published-primitives miss rather than a
justified stdlib reach — exactly the drift the `/published-primitives-reflex` skill exists
to catch, arriving by the primitive moving rather than the consumer.

**Decision needed:** one-line adoption, or leave it (a Node CLI reaching for `Buffer` is
defensible on its own terms). Low stakes; flagged because the justification is now stale.

### B1.3 — an open question and a deferral, both recorded nowhere

- **`ks-encoding`:** whether `ks get` / `ks export` should auto-detect non-UTF-8 secret
  bytes and default to `base64`. Lives only in the stream's `result.md`. Its stated
  precondition has **half** landed: `KeyStore` now carries an `'opaque'` symmetric secret
  type with `importSecretBytes` / `getSecretBytes`, but `tools/ks/src` exposes none of it,
  so the "via the CLI" half has not arrived.
- **`ts-prompt-assist`:** the archived README says typed qualifier *values* (round-2
  finding F5) is "queued in `docs/FUTURE.md`". It is in neither `FUTURE.md` nor
  `TECH_DEBT.md`.

**Decision needed:** file both, or close them. The second is the more concerning shape — a
completion record asserting something was queued, when it was not.

### B1.4 — a request-side blind spot on the client-tool surface, twice

**Read this correction first if you saw an earlier version of this file.** A first draft of
this section said `ai-assist-client-tools` "shipped broken" and counted three instances.
Both are wrong, and the distinction matters.

**What actually happened.** Phase C's exit artifact declared "Complete — all gates green"
with 100% coverage and a passing live-testbed run. A retroactive `code-reviewer` pass found
3 P1s + 6 P2s, headed by: `executeClientToolTurn` never merged client tools into the
request `tools` array, and the three `call*Stream` signatures were still typed
`AiServerToolConfig`. The model was never told the client tools existed. **But all three
P1s were fixed inside PR #447 itself, before it merged** — the fix is at
`streamingAdapters/clientToolContinuationBuilder.ts:627-630`, carrying a comment naming
P1-1, and #447's own body records the live-testbed gate as still ⏸ OPEN at merge, calling
the earlier success claim "suspect". **What shipped broken was the claim, not the code.**
That is a real failure — an exit artifact asserting a live run succeeded when it had
not — but it is a different failure from shipping a broken build to `release`, and the
repo's own retelling should not drift into the stronger version.

**The gap TESTING_GUIDELINES names is closed.** `clientToolContinuationBuilder.test.ts`
now carries `describe('client tools reach the provider (P1-1 regression)')` with four
request-body assertions over a `mockFetchCapturingBody` helper that parses `init.body` —
Anthropic `input_schema`, Anthropic server+client coexistence, OpenAI `function`, Gemini
`function_declarations`. The exact test class the guidelines describe as structurally
absent now exists. Verified.

**What remains.** `ai-assist-client-tool-id-fix` is a **second, later** instance of the
same blind spot on the same files — `r.callId ?? r.toolName` emitted the tool *name* when
the id was nullish, and `??` passed `''` through. It reached a consumer as intermittent
Anthropic "malformed identifier" errors 26 days after cluster close, and neither the
parent's coverage gate nor its live testbed run caught it. Both defects were request-side
or correlation-side; both were invisible to response-mocking tests.

**Decision needed:** two instances on one surface, with the first already codified as a
teaching example, is enough to ask whether `TESTING_GUIDELINES.md` should carry a standing
rule for provider-boundary work — *assert on the request body, not only the response.* The
regression tests that exist today were added reactively for one defect; nothing generalizes
them to the next adapter.

### B1.5 — `LIBRARY_CAPABILITIES.md` still gates a feature on a merged PR

Line 390: *"(`executeClientToolTurn` gains the same `endpoint` override once PR #466
merges; until then the tools path uses `descriptor.baseUrl` only.)"* It has it today —
`readonly endpoint?: string` at `clientToolContinuationBuilder.ts:487`, resolved through
`resolveEffectiveBaseUrl`. A reader following the guide would hand-roll a workaround for a
capability that shipped.

Same file, minor: the Gemini web-search + client-tools note says the request "HTTP 400s".
The library now pre-empts it with a named `Result.fail` before any wire call, which is a
better outcome than the doc promises.

**Decision needed:** both are one-line edits to an instruction file, held back from
auto-commit per the skill. Say the word.

### B1.6 — ledger status was stale by months (fixed in this PR)

`ts-prompt-assist-features` read *"cluster integration branch … ready for promotion to
`release`"*. It promoted via #397 (`88545a5dc`) and four later prompt-assist streams
(#407, #460, #490, #538) had already built on top. **Corrected in this PR** rather than
merely flagged, since the fact is checkable and the wrong version actively misleads.

Worth noting as a category: a status line that was true when written and rots silently is
harder to catch than a wrong one, because nothing ever revisits it. This sweep found it
only because it was reading the entry for another reason.

---

## Batch 2 — the 2026-06 ai-assist streams

Six streams: `ai-assist-cross-provider-continuation`, `-cross-provider-fixes`,
`-message-ordering`, `-responses-reasoning-events`, `-tool-continuation`, and the cluster
parent `per-provider-testbed-scenarios` (pulled forward from batch 3 — see B2.5).

### B2.1 — a deferral both of two streams believed the other had filed (re-queued in this PR)

`runToolUseConversation`, the multi-turn loop helper above the per-turn
`executeClientToolTurn` primitive, was scoped out by **`ai-assist-client-tools`** and again
by **`ai-assist-cross-provider-continuation`**. Each recorded it as out-of-scope; each
believed it was captured in `docs/FUTURE.md`. A grep across `docs/` and `.ai/instructions/`
returns nothing outside completed-stream artifacts. **Re-queued in this PR.**

Two independent deferrals landing in the same hole is the argument for the deferral
*mechanism* needing a home, not the item. Both streams did the right thing locally and the
item still vanished.

Its preconditions have since been met — #454 wired continuation to all four providers, #488
made `continuation.messages` cumulative — so the helper is now writable provider-agnostically.
The gap it would inherit: **every `*ClientTools` testbed scenario is still two-turn**, the
degenerate case where replace and accumulate coincide, which is precisely the blind spot that
hid the original per-round bug. Noted in the re-queued entry.

**No decision needed** unless you disagree with the re-queue.

### B2.2 — a second lost deferral, not re-queued

`ai-assist-tool-continuation`'s brief offered "extend one `*ClientTools` scenario past two
rounds, or file it as a fast-follow". Neither happened. All four scenarios remain two-turn
as of 2026-08-14 and it is in no ledger.

**Decision needed:** file it, or accept unit-level proof for the cumulative-continuation
semantics. I have not filed it because it overlaps B2.1's inherited gap and you may want them
as one item rather than two.

### B2.3 — a `TECH_DEBT` entry pointing at a file that no longer exists (closed in this PR)

The P3 "decompose `ai-assist/apiClient.ts`" described a 2000-line monolith. **#620 already
split it** into `completionClient.ts` / `imageGenerationClient.ts` / `listModelsClient.ts` —
exactly the split the entry's own scope sketch proposed, down to the module names. Marked
RESOLVED; the original reasoning is retained because it is still the best statement of why.

Worth noting how it survived: a **2026-08 "Correction" paragraph was added to that entry**,
warning that whoever next edits the file has zero headroom because CI fails on
`SUCCESS WITH WARNINGS`. That correction was written about a file that was already gone or
going. Someone revisited the entry recently and still did not check whether it was live.

### B2.4 — a findings-inbox disposition that read OPEN for ten weeks (closed in this PR)

`2026-06-04-gemini-tool-schema-additionalproperties.md` recommended "a separate additive
library fix". That fix shipped in **#457** — `toGeminiParameterSchema`, verified present — and
the disposition was never updated. Its two siblings in the same inbox both were.

The bug was not minor: Gemini's OpenAPI-3.0 subset **rejects** the draft-07 keywords
`JsonSchema` emits strict-by-default, so client tools were **completely non-functional on
Gemini** until it landed.

### B2.5 — four streams, one story, zero ledger entries

Neither `per-provider-testbed-scenarios` nor any of its three sub-streams appears anywhere in
`docs/WORKSTREAMS.md`. Two drafters reached that conclusion independently and both recommended
**one cluster entry** over four headings, matching the ledger's existing
`### <id> ✅ (cluster)` convention.

I pulled the cluster parent forward from batch 3 so it could be narrated as a unit rather than
split across two PRs. **Decision needed:** confirm the cluster shape, or say you want four
separate entries.

The story is worth having in the ledger on its own merits: the cluster ran an **empirical
loop** — build live per-provider scenarios, run them against real APIs, let what breaks drive
library fixes — and it caught four bugs across four rounds, every one invisible to a
100%-coverage unit suite. Round 4 used a diagnostic that round 3 had added to **falsify its
own motivating hypothesis**: the OpenAI/xAI empty-completion bug was not budget exhaustion but
an `item_id ↔ call_id` correlation error, with a second latent bug surfacing the moment the
first fix let function calls flow. That is an argument for live-API testing that a mocked
suite structurally cannot make.

### B2.6 — a `TESTING_GUIDELINES` citation that no longer resolves

§ "Coverage Gap Resolution" cites `c8 ignore` directives on "the `rawTail` branch in
`chatRequestBuilders.ts`". Per #454's diff the directives were on the `options?.head` branch,
and **none remain in that file today** — `grep -c "c8 ignore"` returns 0. The teaching point is
intact and important; the citation is now unverifiable.

**Decision needed:** a one-line annotation, or leave it. I did not edit it — it is an
instruction file, and a reader who goes to check the example and finds nothing may discount the
whole guideline, which argues for fixing it, but that is your call.

### B2.8 — three `docs/FUTURE.md` entries are stale in the *opposite* direction

A new category, and the one I'd act on soonest after B2.5. Where the `TECH_DEBT` entry
(B2.3) pointed at a deleted file, these describe **work that has since shipped** and still
read as unqueued:

- **Provider-side request validation** — the Gemini grounding + client-tools case now
  **fails fast** with a named `Result.fail` before any wire call (`ai-assist-antagonist`,
  #529). The entry should narrow to the generalized registry, not be closed outright.
- **Generic-version-alias library surface** — substantially delivered by `ai-assist-model-aliases`
  (#505–#508) and the model-tiers work. The entry still reads as unqueued **and still cites
  `gpt-4o` as OpenAI's default**, which is doubly misleading now.
- **Library default `max_output_tokens` for reasoning models** — genuinely still open, but its
  stated workaround (`otherParams`) is superseded by the first-class `maxTokens` param (#573).

**Decision needed:** narrowing or closing a FUTURE entry is a scoping call, not a fact
correction, so I did not touch them. The `gpt-4o` reference is the one worth fixing regardless
of what you decide about the entries themselves — it will misinform anyone who reads it.

The pattern across B2.3, B2.4 and B2.8 is worth naming: **five artifacts in one batch were
stale, and every one of them was true when written.** Nothing in the workflow revisits a
deferral, a debt entry, or a finding once its trigger has fired somewhere else. That is the
structural gap; the individual corrections are symptoms.

### B2.7 — two similarly-named streams, relationship now pinned

`ai-assist-cross-provider-continuation` and `ai-assist-tool-continuation` sound like the same
work. They are orthogonal and neither supersedes the other: **cross-provider owns whether a
provider receives the continuation tail at all; tool-continuation owns what that tail contains
across rounds.** #459 is a git ancestor of #488, and the order is load-bearing — reversed, the
cumulative prepend would have been correct on Anthropic and inert on the other three.

Recorded in both records via `relatedStreams`. No decision needed; flagged because leaving it
vague would have made both records less useful than either alone.

---

## Batch 3 — `json-schema-converter-alignment`, `ollama-native`, `prompt-assist-horizontal-composition`, `retaining-logger-ring-buffer-refactor`, `ts-agent-memory-vector`

### B3.1 — a public surface documents three phases; four shipped

`PromptObservationPhase` is `'resolve' | 'json-output' | 'free-text-output' | 'compose'` —
four members (`observe/types.ts:35`), with the seam wired in `horizontalComposer.ts`, shipped
via **#538**. `.ai/instructions/LIBRARY_CAPABILITIES.md`'s ts-prompt-assist observability
paragraph still enumerates **three** and omits `'compose'`.

This is worse than a stale plan: a consumer writing an `IPromptObserver` from the guide would
not know a fourth phase can arrive, and the guide is the documented entry point for exactly
that. **Decision needed** — it is a `LIBRARY_CAPABILITIES` edit, which the skill holds back
from auto-commit. The `docs/FUTURE.md` half (which claimed compose "emits **no** observation")
was a plain fact correction and **is fixed in this PR**.

### B3.2 — `HorizontalComposer`'s documented safeguard pipeline is wrong about where directives are checked

`LIBRARY_CAPABILITIES.md` folds `allowedDirectives` into `applySafeguards`. In code it is a
**separate `_checkAllowedDirectives` pass that runs before** it, and it screens **each
contribution's** directive rather than the merged one. The stream's own `result.md` gets this
wrong in the same direction ("merged directive only known post-merge").

The pipeline, the `escape: 'none'` render and the reject→`fail` behaviour are all correct as
documented; only the directive-check attribution drifted.

Two omissions on the same entry, one load-bearing: the documented `create()` validation list
("unique provenance; every referenced contributor + slot exists") omits that **every
`logicalSlotName` must be declared on `composedDescriptor.slots`** — a check that exists
*precisely because* an undeclared slot would render but be skipped by the safeguard pass. That
check is part of the safety closure the paragraph is selling, and it is missing from the sales
pitch. Also `IComposedPrompt`'s field list omits `descriptor`.

**Decision needed:** same `LIBRARY_CAPABILITIES` hold. Drafts ready.

### B3.3 — "mentioned" and "narrated" are different, and only reading both tells you which

Three of this batch's five streams were *mentioned* in existing entries. On inspection:

- **`json-schema-converter-alignment`** — genuinely narrated. It is a two-phase **spike absorbed
  into its child's record**: `json-schema-derives-t`'s Substrate line claims all six of its
  files and its Origin paragraph narrates the spike's shape and verdict. It authored no merged
  PR; its files reached `release` via the child's #444. → `ledgerEntry:` pointer, no new entry.
- **`ts-agent-memory-vector`** — the parent entry narrates *the work* (naming
  `InMemoryCosineIndex` and embed-on-write) and lists #502 among its constituent PRs, but the
  **stream id never appears in prose**. A reader learns what shipped, not that the stream
  existed. → fold in one sentence, no heading.
- **`ollama-native`** — *not* narrated. The single mention is one clause in
  `ai-assist-embeddings`'s Outcome recording that this stream's OQ-1 was resolved **there**.
  Nothing records the package, its six primitives, or its six PRs. → new entry.

This is why the raw gap count was never the worklist. **No decision needed** — recorded because
any future reconciliation tool has to make the same three-way distinction, and a count cannot.

### B3.4 — two more deferrals with no durable home

- **`ollama-native`:** OQ-2 `generateStructured` (`/api/generate` one-shot structured output)
  and OQ-3's deferred `AbortSignal` on the fast metadata ops (`listModels` / `showModel` /
  `listRunning` / `deleteModel`) live only in `design.md`. Also the brief's rejected-Option-C
  consolation prize — an additive cross-provider `responseFormat?` on the completion path,
  which would have served OpenAI/Groq/Mistral too — is in no ledger.
- **`prompt-assist-horizontal-composition`:** whether the composed body should be *resolved*
  from the composed descriptor's candidates rather than passed in as `composedBody`
  (`result.md` only); the YAML `compositionConverter` for `ILogicalSlotConfig[]` (OQ-3, in
  `LIBRARY_CAPABILITIES` prose but neither `FUTURE` nor `TECH_DEBT`); and design §5's
  "expose the token scanner as a utility" note.

**Decision needed:** file, or close. Running total across the sweep: **six** deferrals found
living only inside completed-stream artifacts.

### B3.5 — an undocumented packlet, and why it exists

`@fgv/ts-utils` gained a `logging-interface` packlet (`ILogger`, `IDetailLogger`,
`ReporterLogLevel`, `isDetailLogger`). It is internal-only and not exported from the library
root, so `LIBRARY_CAPABILITIES.md` correctly needs no entry — but **why** the library has an
interface-only packlet is recorded nowhere except one stream's `state.md`.

The reason is a real constraint a future agent will re-derive the hard way:
`collections/readOnlyConvertingResultMap.ts` already imports `ILogger` from `logging`, so
composing a `collections` primitive inside `logging` creates a packlet cycle. The first fix —
extracting to `base/loggerInterface.ts` — was **rejected** because it made `ILogger` a
top-level export alongside `Logging.ILogger` (non-no-op `api.md`, dual import paths forever);
an `import type` cycle-break was rejected as a footgun. The shipped shape gives
`base → logging-interface → collections → logging`. The drafted ledger entry carries this.

### B3.6 — two merged PR bodies now describe the opposite of what shipped

Not fixable and not worth a follow-up — a merged PR body is a historical record — but both are
traps for anyone reading the PR rather than the stream artifacts:

- **#502** still says *"Embedding-failure policy: fail the `put` loudly, persist nothing"*. That
  reversed **inside the same PR's review loop**: the shipped policy is a best-effort derived
  index — the FileTree record store is authoritative, the vector index is rebuildable, so a
  failed embed/`add`/`remove` is warn-logged and the record operation still succeeds.
- **#477** says `@fgv/ts-utils` is "dep + peer"; it is peer + dev.

---

## Batch 4 — `ts-extras-mcp`, `ts-prompt-assist-observability`, and three brief-only 2026-07 streams

### B4.1 — three streams closed with only a brief, and it was one batch, not three accidents

`ai-assist-gemini-image-refusal`, `ai-assist-openai-frontier-responses` and
`crypto-utils-base64url-hardening` each sit in `completed/` containing **only `brief.md`** — no
result, no state, no README. That is ambiguous between "shipped without an exit artifact",
"never ran", and "absorbed elsewhere", and the artifacts cannot settle it.

**Resolved from current source**, which is the only decisive evidence: every brief's concrete
change exists in the code today, each PR traces to a squash commit on `origin/release`, and a
pickaxe confirms the marker lines arrived *with* those commits. **All three merged 2026-07-07.**
So: one batch where exit artifacts were skipped wholesale.

Their records leave `summary.shipped` and `summary.diverged` **blank** per the retroactive rule —
with only a brief there is no authored account, and synthesizing one from brief-plus-source
would present this sweep's inference as the stream's own claim. Findings sit in `notes`,
attributed here.

**Decision needed:** all three warrant ledger entries (two are unmentioned anywhere). More
usefully — this is a workflow failure mode, not a records problem. A stream that ships without
an exit artifact leaves nothing to finalize *from*.

### B4.2 — an unclosed STOP-FLAG that a later rotation may have overtaken

`ai-assist-openai-frontier-responses`'s brief ends at a STOP-FLAG requiring a **live
`gpt-5.5-pro` canary run by the principal**. Nothing records that it ran. The #568 model
rotation then repointed `@openai:pro` to `gpt-5.6-sol`, which may have made the gate moot — or
may have quietly stepped over it.

**Decision needed, and this is the one I'd look at first in this batch:** confirm whether the
canary ran, or whether the routing it was meant to validate is now exercised by a different
model. A gate that was neither closed nor cancelled is the worst of the three states.

### B4.3 — the observation fan-out claim is no longer exhaustive

Refining B3.1 with better attribution. `LIBRARY_CAPABILITIES.md` says observer fan-out fires
"once per public `resolve` / `resolveJsonOutput` / `resolveFreeTextOutput` call". A **fourth**
producer now exists: `PromptLibrary` exposes an `_observationSeam`
(`promptLibrary.ts:320,379`) handing the seq minter and `_observe` to `HorizontalComposer`.

**Whose defect it is matters, and it is not `ts-prompt-assist-observability`'s.** That stream's
own artifacts prove `'compose'` was explicitly deferred — `phase-b-triage.md` OQ-7 and its
README both list composer-side observation as out of scope, and the (now struck) `FUTURE.md`
entry names the seq-coordination seam as the blocker #538 later solved. The enumeration was
**correct when written** and went stale two months later. Same rot pattern, but the record that
wrote it was right.

**Decision needed:** the `LIBRARY_CAPABILITIES` edit from B3.1, widened to cover the seam.

### B4.4 — a doc reference to a stream directory that does not exist

`docs/` references `.ai/tasks/active/credential-store`. No directory of that name exists in
`active/` **or** `completed/`. Either a stream never created, one deleted without updating its
referrer, or a rename whose old name survived.

**Decision needed:** you will know which. I did not guess. (Six *other* stale `active/` paths
were confirmed migrated and repointed in this PR; the remaining ten are correct.)

### B4.5 — the Result-integration-boundary convention is not uniform on dependencies

`LIBRARY_CAPABILITIES.md` presents "Result-integration boundary" as a package-shape convention
with an explicit NOT-in-scope list. The **dependency posture inside it was never uniform**:
`ts-extras-mcp` and `ts-extras-webauthn` take direct dependencies; `ts-extras-transformers` and
`ts-extras-ollama` use peers. `ts-extras-mcp`'s design cites "webauthn-style" explicitly, so
this is a consistent *choice*, not an oversight — but the convention text does not mention the
axis at all.

**Decision needed:** decide it once and say so in the convention, or state that the posture is
per-package by design. Either is fine; silence is what makes each new boundary package
re-litigate it.

### B4.6 — `ts-extras-mcp`'s one-file-SDK-isolation claim, precisely

It holds for shipped code: production imports of `@modelcontextprotocol/sdk` live only in
`sdk.ts`. One test file imports the SDK's server/in-memory-transport surface deliberately, for
a real-SDK end-to-end pass. So the v2 rename is one production file **plus that test** — the
claim stands, but "isolated to one file" is worth reading as "one file in `src/packlets`".

Worth noting *why* that test exists: rather than trust 100% coverage over a mocked SDK seam,
the stream re-verified both constraints against a real in-memory MCP server across all five
rejected schema classes. It found no production bug and closed a fidelity gap — the same
instinct the `per-provider-testbed-scenarios` cluster is the canonical example of.

---

## Batch 5 — `safer-fetch-s3`, and the `active/` triage

### B5.1 — eight of the nine streams in `active/` already shipped

Full detail in **`docs/ACTIVE-STREAM-TRIAGE.md`** (added in this PR). Classification, decided
from source rather than from artifacts: **8 SHIPPED-UNMIGRATED, 1 PROPOSED.** The single genuine
proposal is `agent-memory-mcp-server`, which is conditional by construction and stays put.

This is the sweep's largest single finding and it is the protocol failure at full scale. The
artifact protocol says the migration ships **in the same PR as the work**; for these eight the
work merged weeks ago, so that PR is long gone and the honest move is a judgement call:
`close`-after-the-fact (move now, backfill `meta.yaml` + README + ledger entry) versus running
`retroactive` where they sit. **That call is yours** — it moves directories, and getting it
wrong scatters artifacts.

Note what this does to the corpus arithmetic quoted throughout this file: the "68 directories,
41 entries" split treats `active/` and `completed/` as meaningful states. For eight of nine
directories, `active/` is simply wrong.

**Decision needed**, and the report proposes an order: the seven straightforward ones as a batch,
then two that need a decision rather than a script —

- **`safer-fetch`** → migrate *intact* with `ledgerEntry: fetch-primitive-threat-model`. It is the
  **sole surviving artifact record** for sub-streams S1 / S2a / S2b, which have no archived
  directories of their own. Splitting or thinning it loses them.
- **`esm-emit-design`** → do **not** migrate alone. Its implementing sibling `esm-emit-impl` is
  also in `active/` and is narrated in the ledger's *Completed* section with a ⚠️. Move the
  design→implement pair together and update the ledger's `active/` path references in the same
  change. Leaving both is defensible; splitting them is not.

The report also flags three artifact claims to correct during migration, including
`packaging-prepublish-fixes`'s finding header reading *"not fixed, deliberately"* for something
fixed in the same PR — all 25 LICENSE files now exist.

### B5.2 — safer-fetch's security guarantees hold; one coverage gap filed

All six spot-checked guarantees on the fetch primitive verified **in code, not prose** — required
`addressGuard`, per-hop revalidation before any connection, monotonic credential stripping,
guard-cleared loop comparison, full re-walk on retry with a clamped `Retry-After`, and the
browser sibling refusing `'validate-each-hop'` at option resolution. **No overstated guarantee.**

Filed to `TECH_DEBT.md` (P3): the browser suite cannot construct a `Response` — jsdom ships no
Fetch globals — so `browserSaferFetch.test.ts` drives only a *failing* transport, and every
success-path semantic on the browser entry points is covered solely by the `ts-extras` suite on
the shared core. Mostly fine by construction; the gap is that the premise is untested on the
browser side, so a regression in the thin wrapper would be caught by neither suite. Before this,
`TECH_DEBT.md` and `FUTURE.md` contained **zero** safer-fetch entries.

---

## Where the sweep landed

**22 streams recorded** across five stacked PRs (#625–#629), each with a `meta.yaml` carrying a
synthesis, keywords, verified PR attribution, and — where they apply — `ledgerEntry:` /
`relatedStreams:` / `prHistory`. Drafted ledger entries sit in the PR review threads, uncommitted,
because ledger prose is a curation decision.

**Fixed along the way, all checkable facts:** a `TECH_DEBT` entry pointing at a deleted file; a
findings disposition that read `OPEN` for ten weeks after its fix shipped; a `FUTURE.md` entry
describing a feature that shipped two months earlier; a ledger status reading "ready for
promotion" for a cluster promoted months ago; a wrong TypeScript field name in the ledger; six
dead `.ai/tasks/active/` doc links; and two deferrals that were lost — one of which two separate
streams each believed the other had filed.

**The pattern worth acting on** is not any single correction. Across five batches, **every stale
artifact found was true when it was written.** Nothing in the workflow revisits a deferral, a
debt entry, a finding, or a `FUTURE` item once its trigger fires *somewhere else* — and the
`FUTURE.md` entries rot in *both* directions, some describing work already done. Six deferrals
were found living only inside completed-stream artifacts, where no ledger reader will ever meet
them.

That is the structural gap. The corrections in these PRs are symptoms of it.

---

## Dispositions — 2026-08-15

Owner ruled on the five headline items. Actioned on `integration/sweep-followups`.

| # | item | ruling | what was done |
|---|---|---|---|
| 1 | `argon2` pinned below its binding floor | **fix** | `~0.44.0` → `^0.45.0` (resolves 0.45.1), lockfile updated, change file added. D3's cross-runtime byte-identical output re-verified — the RFC vector and 7-case sweep still agree between `argon2` and `hash-wasm`. `hash-wasm` deliberately left at `~4.12.0`: a style deviation, not a floor violation, and widening the browser engine's minor range on the one property that must stay byte-identical is a bad trade. |
| 2 | unclosed `gpt-5.5-pro` canary STOP-FLAG | **resolve — test was done** | Recorded in the stream's `meta.yaml` as **owner-attested**, dated, explicitly not verified by this pass. The brief is an in-flight artifact and was not edited. |
| 3 | `LIBRARY_CAPABILITIES` drift | **fix** | Five edits — see below. |
| 4 | `.ai/tasks/active/credential-store` names a directory that exists nowhere | **withdrawn — the finding was wrong** | `docs/FUTURE.md:865` reads *"**consumer's** `.ai/tasks/active/credential-store/spec.md`"*. It is a cross-repo pointer at PersonAIlity's tree, correctly labelled as theirs. Nothing is dangling. The sweep grepped for `.ai/tasks/active/<name>` and treated every hit as pointing at our tree, missing the qualifier immediately before it. |
| 5 | boundary-package dependency posture unstated | **add it** | Stated in the convention section, with the axis that actually decides it. |

### Item 3, in detail

- **Observation phases: three → four.** `'compose'` added to the `IPromptObservationRecord` phase list, and the fan-out paragraph now says a fourth producer exists (`PromptLibrary`'s observation seam, fired by `HorizontalComposer.compose()`). This was the load-bearing one: a consumer writing an `IPromptObserver` from the guide would not have known a fourth phase arrives.
- **`HorizontalComposer`'s `allowedDirectives` check** was documented as part of `applySafeguards`. It is a **separate pass that runs before** it, screening **each contribution's** directive — the merged slot has no single directive to screen. Corrected.
- **`create()`'s validation list** omitted two shipped checks, one load-bearing: every `logicalSlotName` must be declared on `composedDescriptor.slots`, which exists *precisely because* an undeclared slot would render and then be skipped by the safeguard pass. Added, with that reason.
- **`executeClientToolTurn`'s `endpoint` override** was gated on "once PR #466 merges". It has it. Corrected to describe what ships.
- **Gemini grounding + client tools** was documented as producing a provider HTTP 400. The library now pre-empts it with a named `Result.fail` before any wire call — a better outcome than the doc promised.

### Also taken as obvious cleanup

- **Three `FUTURE.md` entries stale in the shipped direction**, annotated rather than deleted, because each retains scope that is genuinely still open: the generic-version-alias surface (delivered by #505–#508; its `gpt-4o`-is-the-default example was two model generations out of date), provider-side request validation (the motivating Gemini case now fails fast; only the generalized registry remains), and the `max_output_tokens` default (still open, but its `otherParams` workaround is superseded by first-class `maxTokens` from #573 — which makes the case *weaker*, not stronger).
- **`TESTING_GUIDELINES`' `c8 ignore` example** cited directives in `chatRequestBuilders.ts` that no longer exist — the `options?.head` path became reachable in #480 and they went with it. Marked historical so nobody hunts for the code.
- **The `ai-assist-client-tools` retelling in `TESTING_GUIDELINES`** implied a broken build shipped. It did not: all three P1s were fixed inside #447 along with the four request-body tests that should have existed from the start, and those tests are in the suite today. What shipped broken was the **exit artifact's claim**. Corrected in place — and it is arguably a *purer* example of what that section teaches, since the gate signed off on an assertion nobody had checked.

### Still open after this pass

the `active/` migrations in `ACTIVE-STREAM-TRIAGE.md`, including the two deferrals that should be filed **before** migrating, since migration is the event that buries them · directory/entry naming mismatches · the two `ai-assist` request-side-blind-spot instances, if they warrant a standing rule.

### Triage step 1, ruled 2026-08-15

The triage report asked for two deferrals to be filed **before** any `active/` migration, on the
grounds that migration is the event that buries them. Owner ruled on both:

- **Web-rig coverage gate** (`ts-res-ui-components` and siblings declare thresholds of `0`, so
  #517's rig fix never reaches them) — **deferred.** Not filed. Recorded here so the next sweep
  finds a decision rather than re-discovering the gap: it is known, and it is not being carried.
- **`IMemoryIndex` partial-read redesign** — **queued**, as
  `agent-memory-index-partial-read` 🟢 in `docs/WORKSTREAMS.md` § Active workstreams. It is next
  up. It went to the ledger's active queue rather than `FUTURE.md` because it is work we intend
  to start, and `FUTURE.md` is where things go when we don't.
