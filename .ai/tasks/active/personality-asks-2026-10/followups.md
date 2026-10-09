# Followups — PersonAIlity asks, 2026-10

Orchestrator-owned. Drained 2026-10-02 from the 17 inbox files of the finalized `personality-intake`
stream (`.ai/tasks/completed/2026-10/personality-intake/findings/inbox/`).

**Drain deviation, deliberate:** the inbox files are **not deleted**. They sit inside a finalized
stream's record, and that stream's README and `index.md` cite them. The inbox file is the long form;
each entry below names its slug.

**Read the inbox file before acting on any entry**, not the issue alone. On #648 the requester withdrew
the issue body's diagnosis in a comment.

## How to read an entry

- **Req. priority** is the requester's label. It is an input, not our ranking.
- **Verified** says what the orchestrator checked **at `release` @ `0574c39d`, by reading source**.
  Anything not listed under it is unverified. Per the previous cycle's handoff (§ 4, trap 2), a
  "verified" label earns *more* scrutiny from the stream that inherits it, not less: the stream's job
  includes deciding whether the orchestrator was right.
- **Route** is a candidate, not a commission. The user prioritises.

Context the whole batch shares: PersonAIlity is adding **MCP client** support. Thirteen of the 17 lie
on that path (8 `ts-extras-mcp`, 4 of the 5 `JsonSchema` asks, and the ai-assist signal ask).
**None of the 17 asks for an MCP *server*.** That is the separate, already-proposed
`agent-memory-mcp-server` stream, and nothing here changes its premise.

---

## Class A — defects in shipped surfaces

### 1. ts-extras browser barrel omits symbols ts-web-extras calls at runtime — personaility#648
- **Slug:** `2026-08-30-0732-web-extras-browser-fromBase64Strict`
- **Req. priority:** none stated; "breaks a shipped journey"; re-verified at `-55`, `-56`, `-57`.
- **Verified:** `fromBase64Strict` is missing from `crypto-utils/index.browser.ts`, with two call sites
  (`browserCryptoProvider.ts:354`, `httpTreeAccessors.ts:471`). The existing parity test compares
  **top-level** names only, so it cannot see a missing namespace member.
- **Orchestrator error, refuted by the stream:** the orchestrator also claimed `Constants` was missing
  from the browser barrel. It is not. `model.ts:24-25` exports the namespace, and the barrel re-exports
  it through `export * from './model'`. The orchestrator's grep checked the barrel's own lines and
  missed the re-export path. This is the handoff's § 4 failure again: reasoning about what a barrel
  exports without following what implements it.
- **Route:** **shipped** in #717 (`3515f456`), stream `ts-extras-browser-barrel-gaps`
  (`.ai/tasks/completed/2026-10/ts-extras-browser-barrel-gaps/`).

### 2. `JsonSchema.object` with `additionalProperties: true` silently drops undeclared keys — personaility#679
- **Slug:** `2026-10-01-0043-json-schema-open-object-drops-keys`
- **Req. priority:** P1 ("because the failure is silent").
- **Verified:** `_buildObjectConverter` (`json-schema-builder/factories.ts:459-477`) calls
  `Converters.object(fields, { strict: !additionalProperties })`, and `ObjectConverter._convert`
  (`ts-utils/.../objectConverter.ts:225-241`) builds its result **from declared fields only**;
  `strict: false` merely suppresses the unexpected-key error. So the factory's own option docstring
  ("Set `true` to allow extra fields", `factories.ts:103`) is false in effect. **Every
  `JsonSchema.object(…, { additionalProperties: true })` caller is affected, not only `fromJson`.**
  `fromJson` maps an *absent* `additionalProperties` to `true` as well (`fromJson.ts:413`).
- **Correction (2026-10-03):** the stripping was *deliberate*, as the code comments and a pinned test
  say. The "docstring is false" framing above overstated it. The real defect was that the wire
  (`toJson()` omits the keyword, so the object reads as open) and the converter (strips the keys)
  disagreed.
- **Route:** **shipped** in #720 (`e5a40969`), stream `json-schema-open-object`. Undeclared keys now
  pass through as validated `JsonValue`; the wire is unchanged; an own `__proto__` key is dropped at
  every depth (including in `Converters.jsonObject`). A schema-valued `additionalProperties`
  ("record", entry 6) is still refused, and `_convertUndeclaredKeys` is its seam.

### 3. `IProvenance.derivedFrom` docstring calls it a back-link — personaility#670
- **Slug:** `2026-09-28-1501-agent-memory-derived-from-docstring`
- **Req. priority:** none; "the docstring; nothing else".
- **Verified (by intake, not re-checked):** `ts-agent-memory/src/packlets/types/envelope.ts:33-39`
  still reads "Scope-qualified back-link to the source record".
- **Route:** chore. Doc only, plus a change file (the change-file gate keys off files touched).

---

## Class B — `JsonSchema` vocabulary for real-world MCP schemas (`ts-json-base`)

**Shared finding:** most of these are **builder** extensions, not just `fromJson` acceptance. The
builder has no `any`, no record, no numeric `enumOf` (`enumOf<T extends string>`), no `pattern`, and
no range constraints (the last is already in TECH_DEBT P3 "`JsonSchema.integer` cannot state a
range"). `fromJson` can accept only what the builder can represent. Per CODING_STANDARDS
§ "Extending core libraries", the builder is what grows.

Every entry here **widens an accepted set**, so `install-run-rush.js test` repo-wide is the gate, not
`rebuild`. `ts-extras-mcp` has fixtures pinning which schemas are skipped.

### 4. `fromJson`: accept `anyOf`/`oneOf` `[T, null]` as nullable — personaility#680
- **Status:** **shipped** in #723, promoted to `release` by #727 (`0e1028e3`); stream `json-schema-fromjson-widening`. Issue closed.
- **Slug:** `2026-10-01-0043-json-schema-anyof-null-nullable`
- **Req. priority:** P1 ("decides whether FastMCP servers in general are usable").
- **Verified:** `anyOf` and `oneOf` are in `FORBIDDEN_KEYWORDS` (`fromJson.ts:34-44`); the nullable form
  it would normalize to already exists. **Requester's scope line:** general unions stay out.
- **Route:** the smallest of class B, and probably a pure `fromJson` normalization. Candidate for the
  first slice.

### 5. `fromJson`: resolve local `$ref`/`$defs` — personaility#681
- **Status:** **shipped** in #723, promoted to `release` by #727 (`0e1028e3`); stream `json-schema-fromjson-widening`. Issue closed.
- **Slug:** `2026-10-01-0043-json-schema-local-ref-defs`
- **Req. priority:** P2.
- **Verified:** `$ref` is forbidden; `docs/FUTURE.md` already names this our "highest-value" `fromJson`
  addition. Constraint: bounded depth and cycles; remote refs stay rejected.
- **Route:** class-B stream. The design question is inlining versus preserving `$defs` in `toJson()`,
  since inlining a recursive model is unbounded.

### 6. `fromJson`: numeric enums, `pattern`, record, `{}` (any) — personaility#683
- **Status:** **partly shipped** in #723, promoted by #727 (`0e1028e3`): schema-valued `additionalProperties` as a record (`JsonSchema.record`). Numeric `enum`, `pattern` and `{}` are deferred to a later JsonSchema stream (Gemini wire limits; `pattern` is a ReDoS surface). Issue left open with a comment.
- **Slug:** `2026-10-01-0043-json-schema-smaller-mcp-shapes`
- **Req. priority:** P3; "fgv decides which of these to support".
- **Verified:** none of the four is representable in the builder today (see the shared finding).
- **Route:** class-B stream, by sub-shape. **Ours to decide.** Do not ask the requester which ones they
  want; they have already said it is our call.

### 7. Carry constraint keywords through `toJson()` — personaility#682
- **Slug:** `2026-10-01-0043-json-schema-constraints-through-tojson`
- **Req. priority:** P2.
- **Verified:** `fromJson` *ignores* `title`/`default`/`examples`/`format` by design (header comment);
  ranges cannot be expressed at all. **Two packages:** the builder must carry the keywords, and
  ai-assist must know where each provider's strict mode refuses one and fold it into the description
  instead.
- **Route:** the largest of class B, and design-shaped, because the per-provider fold is the hard part.
  It also closes TECH_DEBT P3 (`task_query`'s `limit` bound is prose). Run it **after** 4–6.

---

## Class C — `ts-extras-mcp` client hardening (plus one ai-assist interface)

**Shared design element:** a **failure-kind vocabulary** (entry 9) that entries 8, 13 and 10 all refer
to. Design it once, before any of them ships.

### C1 — cancellation and failure classification

### 8. Per-call timeout and `AbortSignal` on `callMcpTool` — personaility#671
- **Status:** **shipped** in #722, promoted to `release` by #727 (`0e1028e3`); stream `mcp-client-cancellation`. Issue closed.
- **Slug:** `2026-10-01-0042-mcp-call-timeout-abort`
- **Req. priority:** P1.
- **Verified:** `callMcpTool(session, name, args)` (`operations.ts:159`) takes no options; every call
  gets the SDK's fixed 60 s timeout.
- **Route:** C1 slice. Map the call onto the SDK's `RequestOptions`.

### 9. Failure kinds, and observing a session close — personaility#673
- **Status:** **shipped** in #722, promoted to `release` by #727 (`0e1028e3`); stream `mcp-client-cancellation`. Issue closed.
- **Slug:** `2026-10-01-0043-mcp-failure-kind-close-observation`
- **Req. priority:** P1.
- **Route:** C1 slice, **designed first**: the kind set (`tool-error` / `timeout` / `aborted` /
  `not-connected` / `protocol` / `transport` / `unauthorized`, theirs and unverified), and whether it
  rides on a `DetailedResult`. Reconnect policy stays theirs.

### 10. Pass the turn's `AbortSignal` to `IAiClientTool.execute` — personaility#684 (`ts-extras` ai-assist)
- **Status:** **shipped** in #722, promoted to `release` by #727 (`0e1028e3`); stream `mcp-client-cancellation`. Issue closed.
- **Slug:** `2026-10-01-0043-ai-assist-client-tool-execute-signal`
- **Req. priority:** P2.
- **Verified:** `execute: (args) => Promise<Result<unknown>>` (`toolTypes.ts:185`); the single call site
  is `clientToolContinuationBuilder.ts:953`. The optional second argument is additive for callers.
  **In-repo implementers to sweep:** `ts-agent-tasks` `createTaskTools`, `ts-extras-mcp` `adaptMcpTools`,
  `samples/`. Add a `rush rebuild` checkbox.
- **Route:** C1, paired with 8. Without both, the signal stops at the adapter.

### 11. OAuth `authProvider` passthrough and an `unauthorized` kind — personaility#677
- **Slug:** `2026-10-01-0043-mcp-oauth-auth-provider`
- **Req. priority:** P2. It depends on entry 9's kinds.
- **Route:** after C1. An authorization surface: budget for a long review loop
  (CODING_STANDARDS § "Authorization boundaries").

### C2 — egress

### 12. Guarded, non-buffering fetch for `createHttpTransport` — personaility#672
- **Slug:** `2026-10-01-0042-mcp-http-fetch-address-guard`
- **Req. priority:** P1 (blocks their non-admin server registration).
- **Verified:** `createHttpTransport` forwards only `requestInit.headers` (`sdk.ts:150-153`).
  `safer-fetch`'s public operations are `saferFetchJson` / `saferFetchBytes`, which buffer. **The
  requester's own constraint is that the path must not buffer** (Streamable HTTP and SSE).
- **Route:** **design-first**, because the right answer is a new safer-fetch sibling: a guarded,
  `FetchLike`-shaped, streaming fetch that enforces the address guard per hop and strips credentials on
  redirect. That is an extension of the primitive, not a raw-`fetch` passthrough; a passthrough would
  push the SSRF policy back onto every consumer. It is a security boundary, so expect a substantive
  review loop. Note also that `IAddressGuard` lives in `ts-extras` and `ts-extras-mcp` would take it as
  a dependency; check the dependency posture.

### C3 — fidelity and lifecycle

### 13. Rich tool results: resource links, `structuredContent`, media — personaility#675
- **Status:** **in flight**: stream `mcp-round-2a` (brief at `.ai/tasks/active/mcp-round-2a/brief.md` on branch `mcp-round-2a`).
- **Slug:** `2026-10-01-0043-mcp-rich-tool-results`
- **Req. priority:** P2. Minimum bar: a `resource_link` projects to a line carrying its URI.
- **Verified:** already recorded in `docs/FUTURE.md` (multimodal passthrough).
- **Route:** C3. Additive projection beside `content: string`.

### 14. Descriptor `title` / `outputSchema`, and `tools/list_changed` — personaility#676
- **Status:** **in flight**: stream `mcp-round-2a` (brief at `.ai/tasks/active/mcp-round-2a/brief.md` on branch `mcp-round-2a`).
- **Slug:** `2026-10-01-0043-mcp-descriptor-title-list-changed`
- **Req. priority:** P2.
- **Route:** C3. Two parts: descriptor fields (trivial), and a change callback on the session.

### 15. Terminate HTTP sessions on close — personaility#674
- **Status:** **in flight**: stream `mcp-round-2a` (brief at `.ai/tasks/active/mcp-round-2a/brief.md` on branch `mcp-round-2a`).
- **Slug:** `2026-10-01-0043-mcp-terminate-http-session`
- **Req. priority:** P3. Best-effort, since a 405 is acceptable.
- **Route:** C3, or a chore. Small.

### 16. Public transport-injection seam — personaility#678
- **Status:** **shipped** in #722, promoted to `release` by #727 (`0e1028e3`); stream `mcp-client-cancellation`. Issue closed. Delivered as `createCustomTransport`.
- **Slug:** `2026-10-01-0043-mcp-transport-injection-seam`
- **Req. priority:** P2.
- **Verified:** already in `docs/FUTURE.md` ("Transport-injection testability seam").
- **Route:** **candidate enabler, ahead of C1.** It would let our own tests drive 8, 9 and 13–15
  in-process, as well as theirs. That ordering is an unverified judgment; the C-cluster design should
  confirm or reject it.

---

## Class D — standalone

### 17. Weighted pick on `PseudoRandomGenerator` — personaility#669
- **Slug:** `2026-09-27-1631-ts-random-weighted-pick`
- **Req. priority:** none.
- **Verified (by intake):** no weighted pick exists. `ts-random` is an established surface, so the
  addition must be additive.
- **Route:** small stream. The edge rules are the substance: zero weights, all-zero, the last candidate
  winning by elimination, and a pure `pickWeightedAt(unit, …)`. Their two call sites have already
  drifted on exactly those rules, so the tests must pin each one.

---

## Proposed order — for the user to prioritise

| # | what | why here |
|---|---|---|
| 1 | entry 1 (#648) | **shipped**, #717 |
| 2 | entry 2 (#679) | **shipped**, #720 |
| 3 | C1: entries 16 → 9 → 8 + 10 | **shipped**, #722 → #727 |
| 4 | class B: entries 4 → 5 → 6 | **shipped** (6 in part), #723 → #727 |
| 5 | entry 12 (#672) | P1, but needs a new primitive; start its design in parallel with step 3 |
| 6 | C3: entries 13, 14, 15; then 11 | 13–15 **in flight** (`mcp-round-2a`); 11 with 12 in `mcp-round-2b` |
| 7 | entry 7 (#682) | largest design in class B |
| — | entries 3, 17 | cheap; fold into whichever chore batch opens first |

**Parallel-safe pairs:** the C cluster (`ts-extras-mcp` plus the one ai-assist file) is disjoint from
class B (`ts-json-base`). Entry 2 and class B are **not** disjoint; run them in sequence.
