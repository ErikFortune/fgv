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

Files: `src/packlets/tools/{taskTools,presentation,schemas,index}.ts` (227 / 107 / 77 / 6 lines —
nowhere near the cap), `src/packlets/types/tools.ts`, four test suites under `src/test/unit/tools/`
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
| failure messages | cut at 500 UTF-16 units, never inside a surrogate pair |
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
with T2's and T5's no-fallback contracts. A view that rejects or throws (host code) fails through
the same bounded, tool-prefixed message.

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

_(filled in below from `perf/mutationMatrix.js --pkg <copy>` on the final source)_

## Review

### Layer 1 — `code-reviewer`, before any coverage work

Coverage reached 100% from the scenario tests alone; no gap-closure pass was needed or run.
**No P1.**

- **P2-1 (fixed):** a view that rejects or throws — host code — reached the model through
  `thenOnSuccess`'s own capture, **unprefixed and untruncated**. `_read` now captures the call and
  formats the failure like any other. Tests drive a rejecting and a synchronously throwing view with
  a 5,000-character message containing a connection string. Matrix rows I1a-10 and I1a-11 pin it.
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

_(recorded on the PR as it happens)_

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

Run locally on `87d880cf` (package source identical to the PR's code head at the time). A later
source change re-runs the affected rows here.

| gate | result |
|---|---|
| `rush change --verify --target-branch origin/integration/agent-tasks-v1` | change file found (`minor`) |
| `rushx build` (package) | clean, **zero warnings**; `etc/ts-agent-tasks.api.md` updated and checked in |
| `rushx lint` / `rushx fixlint` | clean; fixlint a no-op before commit |
| `rushx test` (package) | **2,058 passed; 100 % statements, branches, functions, lines; zero `c8 ignore`** |
| `rush rebuild` (repo-wide) | exit 0 (3 min 49 s) — required: the build graph gained an edge |
| `rush test` (repo-wide) | exit 0 (7 min 37 s) — required: the renderer accepts a wider set |
| `verify-capability-docs.mjs` | router 21,338/24,000, 24/24 documented, 75 reflexes, 0 failed |
| `generate-capability-feed.mjs --check` | 0 stale |
| `verify-esm-entrypoints.mjs` | 24 checked, 0 failed |
| `verify-bundler-resolution.mjs` | 20 checked, 0 failed |
| `verify-tarball-exports.mjs` | 26 packages, 205 paths, 0 failed |
| CI `build` on `87d880cf` | success |
