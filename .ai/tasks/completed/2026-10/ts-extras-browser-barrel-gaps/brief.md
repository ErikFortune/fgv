# Brief — `ts-extras-browser-barrel-gaps`

**Orchestrator-owned. Frozen at kickoff.** Questions and disagreements go in `state.md`, not here.

**Origin:** PersonAIlity `fgv-ask` [ErikFortune/personaility#648](https://github.com/ErikFortune/personaility/issues/648),
captured as `.ai/tasks/completed/2026-10/personality-intake/findings/inbox/2026-08-30-0732-web-extras-browser-fromBase64Strict.md`.
**Read the inbox file, not the issue body.** The requester withdrew the issue body's diagnosis
(a bundler dropping a Node-only module) in their first comment. The corrected ask is a barrel
addition, not a module reorganization.

**Workflow shape:** `stream`, direct to `release`. Small. Housekeeping ships in the same PR.

## Mission

A shipped journey is broken: recovery-passphrase unlock in a browser fails with
`CryptoUtils.fromBase64Strict is not a function`. `@fgv/ts-web-extras` calls into `@fgv/ts-extras`'
`CryptoUtils` namespace. In a browser bundle, `CryptoUtils` resolves to
`libraries/ts-extras/src/packlets/crypto-utils/index.browser.ts`, and that barrel omits symbols
`ts-web-extras` uses at runtime. Fix the barrel, and add a guard that catches the **class** of defect.

## What the orchestrator believes — verify every line, do not build on it

These come from reading the barrels at `release` @ `0574c39d`. **Nothing here was run.** Part of your
job is deciding whether the orchestrator is right; a refutation backed by evidence is a good outcome.

1. **`fromBase64Strict` is missing** from the browser barrel. `index.ts:58` exports it; the browser
   barrel exports its sibling `fromBase64`. There are two call sites in `ts-web-extras`:
   `packlets/crypto-utils/browserCryptoProvider.ts:354` and `packlets/file-tree/httpTreeAccessors.ts:471`.
   The issue names only the first.
2. **`Constants` is missing as a namespace, and this is wider than the issue.** `index.ts:30-31`
   exports `Constants` as a namespace. The browser barrel (lines 30-37) exports the five constants
   individually instead. `browserCryptoProvider.ts` reads `CryptoUtils.Constants.<X>` about 30 times,
   on every AES encrypt, decrypt, wrap and unwrap path. **The orchestrator's belief:** in a real browser
   bundle, each of those throws `TypeError: Cannot read properties of undefined`, and the requester
   simply has not reached one yet because the `fromBase64Strict` failure comes first. The requester's
   own note says "(and check `Constants`)". **Confirm or refute this by running it** against the
   browser barrel. Do not settle it by reading.
3. **Why nothing caught it:** `ts-web-extras` type-checks against `ts-extras`' Node `.d.ts` rollup,
   so the compiler sees `fromBase64Strict` and `Constants` and is satisfied. Under Jest everything
   resolves to the Node entry, so the unit tests cannot see the gap either. Requester: "Under Node
   every one of these resolves, which is why it shipped — the unit tests structurally cannot see it."
4. **Why the existing parity guard missed it:** `libraries/ts-extras/src/test/unit/index.browser.test.ts`
   compares **top-level** export names only. `CryptoUtils` exists at the top level of both entries, so
   the test passes while the namespace's members differ.
5. A mechanical sweep of every `CryptoUtils.<X>` that `ts-web-extras/src` references (tests excluded)
   against the browser barrel found only these two as runtime misses. `NodeCryptoProvider`,
   `BrowserCryptoProvider` and `IdbPrivateKeyStorage` appear only in TSDoc `{@link}`s, and the rest are
   types. **Re-run the sweep yourself.** The orchestrator's grep matched `Constants` against a
   `// Constants` comment and had to be corrected by hand, which is exactly why it should not be
   trusted.

## The fix

- Add `fromBase64Strict` to the browser barrel.
- Make `CryptoUtils.Constants` resolve in the browser barrel the way it does in the Node one. Whether
  to also keep the individual constant exports is your call. They are browser-only extras, so removing
  them breaks browser consumers; check for consumers before touching them.
- Any further runtime miss your sweep finds is in scope.

## The guard — unverified candidates, NOT a ranking

The requester asked for two things: a check that "nothing in `ts-web-extras` should reference a
`ts-extras` symbol absent from `index.browser`", and, better still, a test that exercises
`browserCryptoProvider` through the browser barrel rather than under Node. Candidates follow. **None has
been checked for feasibility.** Pick what actually catches the class, say why, and record what you
rejected.

- **(a) Deepen `ts-extras`' parity test to namespace members.** For each namespace present in both
  entries, every member the Node namespace exports must also exist on the browser namespace, except an
  **explicit, commented Node-only allowlist** (e.g. `NodeCryptoProvider`, `nodeCryptoProvider`,
  `EncryptedFilePrivateKeyStorage`; derive the real list, do not copy this one). This catches the
  class at the source, for every consumer. Open question: how deep to recurse (`KeyStore` is itself a
  namespace).
- **(b) Run `ts-web-extras`' existing provider and HTTP-tree tests against `ts-extras`' browser
  entry**, for example with a Jest `moduleNameMapper` or a resolver condition. This is the closest to
  the requester's "through a browser bundle", and it would have failed on both misses today. Unknowns:
  whether jsdom/WebCrypto in that suite tolerates it, and whether the browser build output exists at
  test time (`lib/index.browser.js` depends on build order).
- **(c) A static check** that every `CryptoUtils.<X>` value reference in `ts-web-extras/src` exists on
  the browser barrel. Cheap, but it is source scanning and matches only one access shape.
- **(d) Extend `common/scripts/verify-bundler-resolution.mjs`** (the R5 gate, which already bundles
  every browser entry) to also execute something. It is probably heavier than the class warrants.

The `docs/TECH_DEBT.md` P2 "Cross-runtime entry-point export parity is not systematically tested" is
the standing record of this class. Its own verdict is that the trigger has fired repeatedly to no
effect, and it asks for a mechanical gate. **If your guard closes part of that entry, update the entry
in this PR** to say what is now covered and what is not. Do not retire it unless it is fully closed;
nine other packages still have no parity test, and they are out of scope here.

## Package surface

- `libraries/ts-extras` — `src/packlets/crypto-utils/index.browser.ts`, its parity test, and the
  `etc/*.api.md` file if it moves (it should not, since api-extractor reads the Node entry; say so if
  it does).
- `libraries/ts-web-extras` — tests and test config only, if you choose (b). **No source change is
  expected.** If you find you need one, stop and surface it.
- `common/changes/@fgv/<pkg>/*.json` for every package you touch.
- `docs/TECH_DEBT.md` (the P2 entry above), and whatever `/finalize-task` writes.

## Out of scope

- The 16 other PersonAIlity asks in the same intake. The orchestrator is triaging them separately.
- Parity tests for the other nine packages with a browser entry.
- The "21-of-25 unreachable `types` condition" open item: a browser `.d.ts` rollup that would let the
  compiler see this. Note in `result.md` if your work bears on it; do not start it.
- Any module reorganization of `crypto-utils`.

## Acceptance criteria

- [ ] Both misses fixed. Your verdict on the orchestrator's `Constants` claim (belief 2) is recorded
      with the evidence: **run, not read**.
- [ ] A guard that **fails on today's `release`** and passes after the fix. **Load-bearing:** revert
      each barrel line on its own and watch the guard go red for each one. A guard you have not seen
      fail is a guess. Record the revert results in `result.md`.
- [ ] `rushx build`, `rushx lint` and `rushx test` (100% coverage) pass in every modified package, with
      **zero warnings** (`grep -ci warning` on the output, not the exit code).
- [ ] `rushx fixlint` run before the final commit.
- [ ] `node common/scripts/install-run-rush.js change --verify --target-branch origin/release` passes.
      Check the change-file `type` against `.ai/instructions/ACTIVE_DEVELOPMENT.md` § "How to type a
      change file".
- [ ] `docs/TECH_DEBT.md` P2 entry updated if the guard bears on it.
- [ ] `/finalize-task` run: migrate to `.ai/tasks/completed/2026-10/ts-extras-browser-barrel-gaps/`,
      write the ledger entry in the PR itself (anticipating its own merge), and complete the
      capability-feed decision. A barrel fix is probably a `headline: ''` opt-out, but that is
      `/finalize-task`'s call.

## Mechanics

- **Do not run `code-reviewer` yourself and do not spawn agents.** You cannot reach an independent
  reviewer from inside a delegated run; the orchestrator runs it after you commit.
- **Commit your work, then gate.** Run every gate in the foreground. Leave nothing running in the
  background when your turn ends.
- `rush` is not on PATH. Use `node common/scripts/install-run-rush.js <cmd>` from the **repo root**.
  The tree has no `node_modules`, so start with `install`, then `build --to @fgv/ts-web-extras`.
- **Stop and surface**, with a final message of at most 300 words, if: the fix needs a `ts-web-extras`
  source change; the `Constants` claim turns out to be wrong in a way that changes the fix; or no
  candidate guard is feasible without disproportionate machinery.

## Exit artifacts

`state.md` (working surface), and `result.md` covering: what shipped; the verdict on each numbered
belief above; which guard was chosen and why, and which were rejected and why; the revert matrix; gate
output counts; and anything you found that this brief got wrong.
