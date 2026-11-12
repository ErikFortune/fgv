# agent-tasks-drain-principals — bind a subscription's drain to named principals

**Base**: `origin/integration/agent-tasks-host` @ `915aeda3d` (carries #758 + #762, unpromoted).
**Branch**: `agent-tasks-drain-principals`. **Worktree**: `/home/user/fgv-drain`. **PR target**: `integration/agent-tasks-host`.
**Owner of this file**: orchestrator (frozen). Worker writes `state.md` / `result.md`.

## Why
`TaskBroker.bindDelivery` checks only that a subscription exists under `consumerId`. Any host code that can
name a consumer can bind and **drain** it (prepare + acknowledge — the consumer is then owed nothing).
Disclosure stays under the binder's authority; the harm is draining. Recorded as a P2 in `docs/TECH_DEBT.md`
(fgv #780) with this stream as its fix, and it gates promoting #762's `TaskDeliveryPump` /
`DeferredObligations` to `release`. Read first: `.ai/tasks/completed/2026-10/agent-tasks-delivery-and-deferral/`
(`result.md` § review round 3 (c), and the `disposeWithheld` accepted residual), `libraries/ts-agent-tasks/CAPABILITIES.md`
§ delivery, `samples/testbed/src/scenarios/**/journey.ts` (host subscribes, agent drains: ~lines 318, 602, 660, 1115).

Requiring the registrant at `bindDelivery` was tried in #762 and reverted because it breaks the
host-subscribes / agent-drains pattern. Do not repeat that.

## Step 0 — bring `release` in
`release` has moved well past this branch's base (ai-assist, deps refresh, pnpm 11, FsTree confinement,
converter-safe formatting, …). First `git merge --no-ff origin/release` into this branch (no rebase),
resolve conflicts (much of #752–#758 is on both sides under different commit ids — expect mostly clean),
`install`, and gate the merged tree (`rebuild`, `test`) **before** starting the feature, so a later red is
attributable. Commit the merge on its own.

## Decisions (made; record any refinement and its reason in state.md)
1. **Drain principals recorded at `subscribe`.** `subscribe` takes an optional list of principals allowed to
   bind the subscription's delivery (name it to fit the sibling fields, e.g. `drainPrincipals`). Default when
   omitted: the registering principal only. The list is persisted on the subscription record, validated by
   converter (non-empty if given, each a valid principal, de-duplicated), and visible on `ITaskSubscription`.
2. **`bindDelivery` refuses any other principal** with `not-found-or-denied` — the same answer as a missing
   subscription or wrong `consumerId`, so it discloses nothing.
3. **Persisted subscriptions without the field** (written before this change) are treated as registrant-only.
   This is pre-1.0 (`ts-agent-tasks` is an active surface); breaking is allowed, no shim. Provide the host a
   trusted way to set or change a subscription's drain principals (re-`subscribe` if that is already the
   idempotent update path, otherwise a small trusted host operation) — decide which, from the code, and say so.
4. **`disposeWithheld` policy identity (the #762 accepted residual).** Close it if it fits cleanly: e.g. the
   subscription records a host-supplied policy identity at `subscribe`, and `disposeWithheld` requires the
   binding to present the same identity. If on reading the code the clean fix is materially larger than
   decision 1–3 or needs a different shape, do **not** build it: write the proposed design in `state.md`
   and leave the residual documented (and keep the TECH_DEBT entry's half for it open).
5. **Testbed**: update every subscribe-then-another-principal-drains site to name the drainer, so the
   journeys keep passing; add one journey assertion that an unnamed principal is refused.
6. **Docs**: `bindDelivery` / `subscribe` TSDoc, `CAPABILITIES.md` (replace the "host's to keep straight"
   note with the actual rule), `docs/TECH_DEBT.md` (close the entry or its half that this resolves — the
   entry lands on `release` via #780; after Step 0 it may not be on this branch yet — if absent, add the
   closed note in the stream's `result.md` and the orchestrator will reconcile), ledger, close-out.
7. **Change file**: `@fgv/ts-agent-tasks` `minor`, comment prefixed `BREAKING:` (persisted subscriptions
   become registrant-only; hosts that drain on another principal's behalf must name it).

## Tests (red-then-green per item, revert-proved)
- bind by registrant: ok; by a named drainer: ok; by an unnamed principal: `not-found-or-denied`,
  identical to a missing subscription; legacy persisted subscription: registrant-only;
  update of drain principals; converter refusals; the pump (`TaskDeliveryPump`) refuses construction /
  binding the same way; if decision 4 is built, its allow/deny matrix.
- Enumerate every check-then-act window you add (e.g. drain list changed between bind and prepare) in
  `result.md` and say what re-checks after it — this is an authorization boundary.

## Rules
Repo standards (Result pattern, converters, no `any`, 100% coverage, no `c8 ignore` without asking in state.md).
No subagents; apply the code-reviewer rubric inline before coverage closure. Commit first, then gate from the
worktree (`install`, `change --verify --target-branch origin/integration/agent-tasks-host`, `rebuild`, `lint`,
`test` — `rush test` via run_in_background and wait for it). Logs only under the scratchpad `drain/`. Grade by
grep. Push to `origin/agent-tasks-drain-principals` when clean; no PR. Close-out via finalize-task to
`.ai/tasks/completed/2026-11/agent-tasks-drain-principals/` with `#TBD`.
