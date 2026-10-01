**Shipped:** A model can be handed two read-only tools over the agent tasks one principal may see — task_query and task_inspect, ai-assist client tools over a bound view — whose output is bounded by default, never by opt-in.

# Result — `agent-tasks-i1a`

**I1a does not close the stream.** I1b–I1d follow; artifacts stay in
`.ai/tasks/active/agent-tasks-i1a/`, and this family finalizes at cluster close. Written 2026-09-28.

---

## What shipped

- **`tools` packlet.** `createTaskTools({ view, renderer?, budget? })` →
  `Result<ReadonlyArray<AiAssist.IAiClientTool>>`, exactly two tools:
  - **`task_query`** — a page of the tasks the view may read, narrowed by responsible party,
    parent, lifecycle class or statuses; `limit` 1..`budget.context.maxItems` (default the maximum);
    `cursor` to continue.
  - **`task_inspect`** — one task: rendered state, whether it is archived, the commands the view
    reports available for this call, and details when the view's projector exposes them and they fit.
- **`types/tools.ts`**: `ITaskToolBudget` / `defaultTaskToolBudget` (the default context budget —
  20 items, depth 3, 8,000 characters — and 4,000 characters of details), `ITaskQueryToolResult`,
  `TaskInspectToolResult` (resolved / unresolved), `TaskToolPresentation`.
- **Dependency:** `@fgv/ts-extras`, added with `rush add -p` (a 3-line lockfile diff), matching
  `ts-agent-memory`.
- **Renderer extension** (outside the packlet, inside the package — see *The renderer did not fit*).

Files: `src/packlets/tools/{taskTools,presentation,viewAnswers,schemas,index}.ts` (336 / 118 / 87 /
77 / 6 lines — nowhere near the cap; `viewAnswers.ts` added in round 4), `src/packlets/types/tools.ts`, four test suites under `src/test/unit/tools/`
plus a `toolFixtures.ts` helper.

## The factory shape, and how bounding is the default

The factory takes an `IBoundTaskView` and resolves a renderer and a budget; that is all it does.
Each tool's `execute` re-validates its arguments against its own schema, builds a view request, asks
the view, and presents the answer through `TaskContextRenderer`.

**There is no path by which a task reaches the model other than the renderer's text.** The
precedent's defect — *"the built-in default projection returns the full body regardless"* — has no
analogue here, because there is no unbounded default to fall back to:

| output | bound |
|---|---|
| `context` | `budget.context.maxChars` (the renderer's own guarantee, framing included) |
| page size | `budget.context.maxItems` — `limit` above it is **refused**, not clamped |
| `omitted`, `abbreviated` | ids from the page, so ≤ page size × `maxIdLength` |
| `details` | returned only if `JSON.stringify(details).length ≤ budget.maxDetailsChars`; otherwise `detailsOmitted: 'too-large'` and **none** of them |
| `commands` | the registry's command names for this kind |
| failure messages | a view/rendering failure is the code plus a fixed description (host text to `logger` only); an argument failure is cut at 500 UTF-16 units, never inside a surrogate pair |
| `issues` | the view's one generic line |

**Paging skips nothing unannounced.** Bounding text creates a trap the precedent never faced: the
renderer can omit a page item for lack of room, while `nextCursor` continues after the whole page.
Without more, the model would silently never see that task. So every page item the text omitted is
named in `omitted`, and every one it shortened in `abbreviated`, and each can be read with
`task_inspect`. `bounding.test.ts` pages a 25-task repository at a budget with room for two records
per five-task page and checks shown ∪ omitted is every task exactly once.

**A failing projector fails the call — decided, not inherited.** Two projectors sit on the path:
the view's `ITaskProjector` (T5: fails closed, strict output) and the renderer's projection (T2:
fails closed, identity pinned). Both already fail; the tool propagates the failure and returns no
partial page. "Yield less" was rejected for a concrete reason: dropping one item from a page
misstates completeness *and* advances the cursor past a task the model never saw — the same trap
as above, with no id to announce it. Failing is visible to the host and to the model, and consistent
with T2's and T5's no-fallback contracts. **What the model is told about a failure is its code and a
fixed description, never the underlying message** (Copilot round 1): a projector's error text, a
storage detail or a thrown exception goes only to the optional host `logger`.

**`TaskContextRenderer` was reused, and did not quite fit — see below.** Its receipt is discarded:
the tools acknowledge nothing.

## The renderer did not fit, and was extended rather than worked around

A bound view emits `IProjectedUnresolvedReference` — deliberately without a `binding`. The renderer
required `IUnresolvedTaskReference`, binding included, and then never rendered it. Fabricating a
binding would have been a workaround. The extension:

- `IContextUnresolvedReference` — `IUnresolvedTaskReference` with `binding` optional — is what
  `ITaskContextInput.unresolved` and `TaskContextUnresolvedProjection` now take.
- A **new, separate** converter, `TaskConverters.context.contextUnresolvedReference`. The existing
  `context.unresolvedReference` is also the **storage** converter for persisted unresolved records
  (`storageConverters.ts`); widening it would have let a stored reference lose its binding. A test
  pins that it still requires one.
- Breaking only for a host that typed a `TaskContextUnresolvedProjection` against the old parameter
  type (one test did); `ts-agent-tasks` has never been published, so the change file is `minor`.

## Every place a caller-supplied value reaches a read, and what constrains it

"Caller" is the model, through tool arguments. The host's inputs (view, renderer, budget) are trusted
configuration and validated at build time.

| value | reaches | constrained by |
|---|---|---|
| whole argument object | both `execute`s | the tool's closed `JsonSchema` (surplus property fails), re-run in `execute` |
| `responsibility` | `view.query` filter → repository selection | schema (closed `{namespace,key}`), then `broker.boundQuery` (strict), then the view's own converter. Narrows only: it selects among tasks the view's scopes and policy already admit |
| `parentId` | `view.query` filter | schema, `boundQuery` (task-id converter). A hidden parent's children are still authorized one by one; `parentId: 'hidden'` returns nothing (tested) |
| `lifecycleClass`, `statuses` | `view.query` filter | schema enums, `boundQuery` (bounded array, class/status consistency) |
| `limit` | `view.query` page size | 1..`budget.context.maxItems` in `execute` (out of range fails), then `boundQuery` (≤ 200) |
| `cursor` | `view.query` continuation | `boundQuery` (bounded identifier), then the view: cursors are handles bound to the view instance and policy epoch (T5), so a forged or foreign cursor fails |
| `taskId` | `view.inspect` | schema, then the renderer's task-id converter, then the view — which answers a hidden and a foreign id identically (tested through the tool) |

There is no principal, scope, consumer, subscription or actor field anywhere in either schema
(asserted by walking every key of both wire schemas), and the tools take nothing from the view but
`query` and `inspect`.

## The request-body capture test

`src/test/unit/tools/requestCapture.test.ts` runs ai-assist's own `executeClientToolTurn` with a
stubbed `fetch` that records each outbound body, using the **real** provider descriptors from the
registry:

- **Anthropic:** the body's `tools` holds exactly `{ name, description, input_schema }` for both
  tools, with `input_schema` equal to `parametersSchema.toJson()`; the host-only annotations are
  absent from the wire.
- **OpenAI Responses:** exactly `{ type: 'function', name, description, parameters }` for both.
- **Gemini:** both under `function_declarations`, with the sanitized parameters. (Writing this test
  first assumed `functionDeclarations`, found nothing, and was investigated before being believed:
  the tools were there, under Gemini's snake-case key. The test was wrong, not the tools.)
- **Control:** the same capture without the tools finds none — so the assertions above discriminate.
- **Round trip:** a streamed `tool_use` for `task_inspect` runs against a real broker view and comes
  back as a `client-tool-result` with the rendered task; a `tool_use` naming a `principal` is refused
  by the harness's schema validation before `execute` runs.

It would fail if the tools were not sent: the Anthropic and OpenAI assertions are `toEqual` on the
filtered `tools` array, which is empty when no tool reaches the body — the control proves it.
Separately, `factory.test.ts` pins both wire schemas as literals (`JsonSchema.toJson` assertions).

## No `IBoundTaskWriter` member is referenced anywhere in the packlet

The evidence for I1's gate *"read-only use has no mutation dependency"*:

- `grep -rn "IBoundTaskWriter\|Writer\|inspectStop" src/packlets/tools src/packlets/types/tools.ts`
  → no matches. The only view members referenced are `ctx.view.query` and `ctx.view.inspect`.
- The factory's parameter type is `IBoundTaskView`.
- `reads.test.ts` wraps a real view in a recording `Proxy`, drives both tools through success and
  failure paths, and asserts the set of members touched is exactly `{inspect, query}`;
  `factory.test.ts` builds the tools over a view that throws on *any* access.
- Nothing in this slice needed a writer member. The separation holds as designed.

## Revert matrix — run on final source

**Final run on final source** — `perf/mutationMatrix.js --pkg <copy of HEAD b145428f> I1a-1 … I1a-31`,
2026-09-29, suites `tools/|publicSurface|context/|converters/contextConverters`, after Copilot
round 4 changed the source. The copy was `git archive` of the head and `diff -r` identical to the
working tree before and after. **53 red tests across 31 rows.**

Two rows were wrong on the first pass and were corrected, then re-run on the same copy:
- **I1a-21 went red for the wrong reason (12 red).** Its mutant replaced the cursor converter with an
  accept-anything converter but dropped `.optional()`, which made the cursor *required* — every page
  without one failed. A red row that is red for the wrong reason is no evidence for the protection it
  names. With `.optional()` kept, it turns exactly the malformed-cursor test red (1).
- **I1a-31 did not build** (the `as never` cast lost the converter's type). Re-cast to the inspection
  converter's type; 2 red.

| row | verdict | suites that went red |
|---|---|---|
| I1a-1 task_query execute trusts its arguments | 3 red | execute re-validates its arguments with no harness in front › task_query refuses malformed values and out-of-range limits<br>execute re-validates its arguments with no harness in front › task_query refuses surplus fields — a principal, scope or consumer above all<br>failure messages are bounded › the cut never splits a surrogate pair |
| I1a-2 task_inspect execute trusts its arguments | 1 red | execute re-validates its arguments with no harness in front › task_inspect refuses surplus fields and malformed ids |
| I1a-3 a limit above the context budget reaches the view | 2 red | execute re-validates its arguments with no harness in front › task_query refuses malformed values and out-of-range limits<br>failure messages are bounded › a short message is returned whole |
| I1a-4 the query request skips the view's request converter | 1 red | execute re-validates its arguments with no harness in front › task_query refuses malformed values and out-of-range limits |
| I1a-5 tasks the text omitted are not named | 2 red | a page is bounded by default › a task below the depth budget is named as omitted<br>a page is bounded by default › tasks the text had no room for are named, so paging skips nothing unannounced |
| I1a-6 tasks the text abbreviated are not named | 1 red | a page is bounded by default › a task shown with its prose dropped is named as abbreviated |
| I1a-7 details are returned whatever their size | 1 red | an inspection is bounded › details are returned only when the host exposes them and they fit › one character over, none of them is returned and the omission is said |
| I1a-8 failure messages are not truncated | 2 red | failure messages are bounded › a message echoing a huge argument is cut to the bound<br>failure messages are bounded › the cut never splits a surrogate pair |
| I1a-9 truncation may split a surrogate pair | 1 red | failure messages are bounded › the cut never splits a surrogate pair |
| I1a-10 what a view threw reaches the model | 2 red | a failure tells the model a code, never host text › when the view rejects, the model is told only that it failed<br>a failure tells the model a code, never host text › when the view throws synchronously, the model is told only that it failed |
| I1a-11 a view's rejection escapes the capture | 2 red | a failure tells the model a code, never host text › when the view rejects, the model is told only that it failed<br>a failure tells the model a code, never host text › when the view throws synchronously, the model is told only that it failed |
| I1a-12 a page with more after it is rendered as complete input | 1 red | a page is bounded by default › with no limit, a page holds the context budget of tasks, and paging reaches every task once |
| I1a-13 a budget below the framing reserve is accepted at build time | 1 red | createTaskTools › refuses a budget that could never render, before the model ever calls |
| I1a-14 the tool budget admits surplus properties | 1 red | createTaskTools › refuses a budget that could never render, before the model ever calls |
| I1a-15 an inspected task with no room is reported complete | 2 red | an inspection is bounded › a task with no room at all is reported omitted, never returned raw<br>the details budget is independent of the context budget › details that fit are returned even for a task whose text had no room |
| I1a-16 an inspected unresolved task with no room is reported complete | 1 red | an inspection is bounded › a task with no room at all is reported omitted, never returned raw |
| I1a-17 a rendered unresolved diagnostic is not counted as shown | 1 red | task tools read through the bound view › an unresolved registration is shown as a diagnostic, and no source binding ever leaves |
| I1a-18 the renderer requires a binding a bound view never emits | 5 red | TaskContextRenderer › rendered fields › an unresolved reference with no binding — as a bound view projects it — renders the same<br>a view's whole answer is converted before anything reads it › a page holding more tasks than were asked for fails, rather than widening the bound<br>an inspection is bounded › a task with no room at all is reported omitted, never returned raw<br>context converters › unresolved reference › as the renderer accepts it, the binding is optional and nothing else is<br>task tools read through the bound view › an unresolved registration is shown as a diagnostic, and no source binding ever leaves |
| I1a-19 a classified failure's host message reaches the model | 10 red | a failing projector fails the call — it never yields more › the renderer's projection failing fails the call, with no partial page<br>a failing projector fails the call — it never yields more › the view's details projector failing fails the inspection<br>a failing projector fails the call — it never yields more › the view's envelope projector throwing or failing fails query and inspect<br>a failure tells the model a code, never host text › a classified failure is its code and a fixed description; its message goes to the host<br>a view is any IBoundTaskView: every field it returns to the model is checked › a page whose completeness or freshness is not a known value fails the call<br>a view is any IBoundTaskView: every field it returns to the model is checked › an inspection whose commands or archived flag are malformed fails the call<br>a view's whole answer is converted before anything reads it › a page holding more tasks than were asked for fails, rather than widening the bound<br>a view's whole answer is converted before anything reads it › an inspection whose state is neither resolved nor unresolved fails, never reads as resolved<br>a view's whole answer is converted before anything reads it › malformed issues, or a field a page does not have, fail the call<br>what a page carries besides the rendered text is checked, not trusted › a malformed cursor from the view fails the call rather than reaching the model |
| I1a-20 a view's issue text reaches the model | 1 red | what a page carries besides the rendered text is checked, not trusted › a view's issue text reaches the host, and the model is told one fixed line |
| I1a-21 a view's cursor reaches the model unchecked | 1 red | what a page carries besides the rendered text is checked, not trusted › a malformed cursor from the view fails the call rather than reaching the model |
| I1a-22 a view's failure code is trusted | 1 red | a view is any IBoundTaskView: every field it returns to the model is checked › a failure code outside the known set is treated as no code at all |
| I1a-23 a page's completeness is trusted | 1 red | a view is any IBoundTaskView: every field it returns to the model is checked › a page whose completeness or freshness is not a known value fails the call |
| I1a-24 a page's freshness is trusted | 1 red | a view is any IBoundTaskView: every field it returns to the model is checked › a page whose completeness or freshness is not a known value fails the call |
| I1a-25 an inspection's command names are trusted | 1 red | a view is any IBoundTaskView: every field it returns to the model is checked › an inspection whose commands or archived flag are malformed fails the call |
| I1a-26 an inspection's archived flag is trusted | 1 red | a view is any IBoundTaskView: every field it returns to the model is checked › an inspection whose commands or archived flag are malformed fails the call |
| I1a-27 an inspection's state is trusted | 1 red | a view's whole answer is converted before anything reads it › an inspection whose state is neither resolved nor unresolved fails, never reads as resolved |
| I1a-28 a page may hold more tasks than were asked for | 1 red | a view's whole answer is converted before anything reads it › a page holding more tasks than were asked for fails, rather than widening the bound |
| I1a-29 a page's issues are trusted | 1 red | a view's whole answer is converted before anything reads it › malformed issues, or a field a page does not have, fail the call |
| I1a-30 a page may carry fields it does not have | 1 red | a view's whole answer is converted before anything reads it › malformed issues, or a field a page does not have, fail the call |
| I1a-31 an inspection is read without being converted | 2 red | a view is any IBoundTaskView: every field it returns to the model is checked › an inspection whose commands or archived flag are malformed fails the call<br>a view's whole answer is converted before anything reads it › an inspection whose state is neither resolved nor unresolved fails, never reads as resolved |

**31 rows, 0 UNVERIFIED, 0 `0 red`.** One row needed correcting first, in the preliminary run (on pre-format source): I1a-18 first came back `0 red`: its mutant
(`.optional().withConstraint(b => b !== undefined)`) was a no-op, because `strictObject` never calls
an absent optional field's converter. The protection was guarded; the mutant was not a mutant.
Dropping `.optional()` turns 4 tests red. No row needed `paired(...)`: the one defence-in-depth pair
(schema revalidation backed by `boundQuery`, backed by the view's own converter) is separated by the
tests' "the view was never called" assertion, which I1a-1 and I1a-4 each turn red on their own.

## Review

### Layer 1 — `code-reviewer`, before any coverage work

Coverage reached 100% from the scenario tests alone; no gap-closure pass was needed or run.
**No P1.**

- **P2-1 (fixed, then fixed properly in Copilot round 1):** a view that rejects or throws — host
  code — reached the model through `thenOnSuccess`'s own capture, **unprefixed and untruncated**.
  The layer-1 fix captured it and prefixed and truncated it. That bounded the text but still
  disclosed it; see round 1.
- **P2-2 (addressed in this PR):** docs, change file and artifacts were not yet written at review
  time. The `package.json` ordering it queried is `rush add`'s own output.
- **P3-a (documented):** details can be returned for a task whose text was omitted — the two budgets
  are independent. Documented on the type and in `CAPABILITIES.md`, with a test.
- **P3-b (documented, routed):** details are unframed host JSON. Documented; routed to
  `docs/TECH_DEBT.md` for I2.
- **P3-c (fixed):** the harness-refusal round-trip test now asserts the message names the surplus
  field.
- **P3-d (fixed):** `ICreateTaskToolsParams.renderer` now says its converters also validate the
  model's arguments.

### Layer 2 — Copilot

The first request did not register (no reviewer listed after 35 minutes); the second produced round 1.

**Round 1 — one high, two medium; all real, all fixed.**

| finding | fix |
|---|---|
| **(high)** the model-facing boundary prefixed and truncated failures but still forwarded the raw message from the view, a projector or a thrown host error — a connection string reached the model, as layer 1's own test demonstrated. Truncation bounds a disclosure; it does not prevent one | every failure the view or the rendering reports now reaches the model as `<tool>: <code>: <fixed description>` (a `Record<TaskFailureCode, string>`, so a new code cannot be missed); a rejection or throw as `<tool>: the task view failed`; an unclassified failure as `<tool>: the request failed`. The underlying message goes to a new optional `logger` (`Logging.ILogger`) — `warn` for a reported failure, `error` for a throw. Only argument-validation failures, which describe the model's own input, are passed through (still cut at 500). Tests: rejecting and throwing views, three classified codes carrying a filesystem path, an unclassified failure, and the projector-failure tests now assert the fixed message plus the logger's copy. New matrix rows I1a-10 (re-pointed) and I1a-19 |
| **(medium)** the Gemini capture checked names and an `objectContaining` shape, so a serializer dropping descriptions, enums or required members would pass | the test now pins both complete `function_declarations` entries. Recorded while writing it: **Gemini's dialect drops `additionalProperties`**, so on Gemini the schemas' closure is enforced by validation (harness, then `execute`), not stated on the wire |
| **(medium)** the PR description said the final revert matrix was still owed while `result.md` recorded it | PR description reconciled; the matrix has been re-run on this round's source (below) |

**Round 2 — two low posted, one "previously missed", and a headline naming two more; three real.**

| finding | disposition |
|---|---|
| (low) `result.md` gave `taskTools.ts` as 227 lines; it is 286 after round 1 | fixed |
| (low) the ledger said the matrix ran `I1a-1`…`I1a-18` | fixed (now `…I1a-21`) |
| (previously missed, low) `contextUnresolvedReference`'s doc linked `unresolvedReference` — the storage converter with the opposite contract — as if it were its base | fixed: the doc now says what differs and why the two are separate |
| (headline only, not posted) "unbounded issue text" | **real, and the same class as round 1's high**: `task_query` passed the view's `issues` strings through verbatim. The broker only ever emits one generic line, but `createTaskTools` accepts any `IBoundTaskView`, so a host's view could put unbounded host text in front of the model. Now the model gets one fixed line when there are any, and the view's text goes to `logger`. The sibling hunted while there: `nextCursor` was also passed through unchecked, and is now converted as a page cursor (a malformed one fails the call as `invalid`). New tests; new matrix rows I1a-20, I1a-21 |
| (headline only) "surrogate-pair error truncation" | re-examined, **no defect**: the cut backs off one unit when it would land on a low surrogate, pinned by *the cut never splits a surrogate pair* and matrix row I1a-9 |

**Round 3 — one high, real; and its class swept.**

`IBoundTaskView` is a public interface a host can implement, and the tools trusted the failure
`detail.code` it returned: a forged code went into the model's message verbatim (and produced an
`undefined` description). The code is now converted against the known set; anything else is treated
as no code at all (`<tool>: the request failed`).

This is round 2's defect again — a field the view returns reaching the model unchecked — so the fix
was not the one field but **every field of the view's answer that is not already converted by the
renderer**: the page's `completeness` and `freshness` (enumerated values), the inspection's `commands`
(command-name identifiers, at most 100) and `archived` (a boolean). Each malformed value fails the
call with the fixed `invalid` message; the field's name goes to the log, never its value. What the
renderer already converts (envelopes, unresolved references), what round 2 covered (`issues`,
`nextCursor`), and `details` (host JSON, size-bounded, documented as unframed) complete the list —
no field of a view's answer now reaches the model unconverted. New matrix rows I1a-22 … I1a-26.

**Round 4 — one medium posted and two "previously missed", all the same class a third time; fixed
at the root.**

The posted finding: `inspection.state` was used as a discriminator unchecked, so a view answering
`state: 'bogus'` fell into the resolved branch and reached the model looking like a real task. The two
previously missed: a page holding more tasks than the `limit` asked for was accepted, so `omitted` /
`abbreviated` were bounded by whatever the view sent; and `issues` was read without being checked as a
bounded string array.

Rounds 2, 3 and 4 were one defect found three times, one field per round: **the tools trusted the
shape of a view's answer**. Patching field by field had not converged, so round 4 fixes the cause. A new
`viewAnswers.ts` holds strict converters for a view's whole answer — the page (strict object, projected
items and references, **at most the requested `limit` together**, a page cursor, enumerated
completeness/freshness, at most 100 string issues) and the inspection (`oneOf` a strict resolved or a
strict unresolved shape; the resolved one pins `state`, commands, `archived` and details). **Nothing
reads a view's answer until it has converted**; the per-field checks of rounds 2 and 3 are gone,
subsumed. The converter's message can quote the answer, so it goes to the logger only; the model sees
the fixed `invalid` line. `oneOf` over literal-pinned arms rather than `discriminatedObject`, because
the latter indexes its arm table with the raw discriminator (an inherited key such as `constructor`
would be found). Matrix rows I1a-21 and I1a-23 … I1a-26 re-pointed at the converter fields; new rows
I1a-27 … I1a-31.

**Round 5 (on `9e081180`, the round-4 code) — no findings.** The review lists nothing open, marks
round 4's thread resolved, and names nothing as previously missed. Every review thread on the PR is
resolved. Its headline says "four moderate findings remain unresolved", but the review names none,
and no unresolved thread exists to match it. No source changed, so the round-4 matrix and gates stand.

**Loop stopped at 5 rounds on diminishing returns:** round 5 produced no findings.

Layer 1 and Copilot round 1 found the same defect twice at different depths: layer 1 saw an
*unbounded* message, fixed the bound, and left the *disclosure*. Worth carrying into I1b: a
model-facing failure path is a disclosure surface, not a formatting one.

## Routed beyond this slice

- `docs/TECH_DEBT.md` **[P3]** details are unframed host JSON beside framed context — trigger: I2.
- `docs/TECH_DEBT.md` **[P3]** `JsonSchema.integer` has no `minimum`/`maximum`, so `limit`'s range is
  description-only on the wire — trigger: the next tool schema needing a range (I1b/I1c likely).
- **For I1b:** mutation opt-ins are not spelled yet — I1a deliberately added no selection parameter,
  so I1b decides the opt-in shape without inheriting one. `_message` / `_read` are the failure path
  every new tool should reuse.
- **For I1c:** generated command tools will need the registry's parameter schemas as `JsonSchema`;
  the range gap above applies.
- **For I1d:** `inspectStop` is on `IBoundTaskView` and deliberately unused here.

## Gates

Run locally on `b145428f` — the source after Copilot round 4.

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found (`minor`) |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` updated and checked in |
| `rushx lint` / `rushx fixlint` | clean; fixlint a no-op before commit |
| `rushx test` (package) | **2,068 passed; 100 % statements, branches, functions, lines; zero `c8 ignore`** |
| `rush rebuild` (repo-wide) | exit 0 (3 min 59 s) — required: the build graph gained an edge |
| `rush test` (repo-wide) | exit 0 (8 min 19 s) — required: the renderer accepts a wider set |
| `verify-capability-docs.mjs` | router 21,338/24,000, 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed |
| CI `build` on `b145428f` | success |
