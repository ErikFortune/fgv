# State — `publish-tarball-gate`

Branch: `claude/publish-tarball-gate-omgb9e`, based on `esm-emit-impl` @ `29d07bcba`.

**⚠️ Rebase onto `release` is still owed.** #603 and #605 were both still **open** when this stream
ran — the brief's hard dependency was not met. Proceeding on the unmerged base was the deliberate
call: it is the exact starting state the brief describes, and the diff touches no file either PR
touches except `verify-esm-entrypoints.mjs`, where the change is an additive header comment. See
`result.md` § Deviations.

## Checkpoints

- [x] Required reading complete (both sibling gates, consumer note, monorepo guide, brief)
- [x] `rush install` + `rush rebuild` green (rebuild required — the gate needs real build output)
- [x] Instrument chosen and validated: `npm-packlist`, byte-identical to `npm pack` on 4 packages
- [x] `common/scripts/verify-tarball-exports.mjs` written
- [x] `rush-pack-check` autoinstaller added; shared shrinkwrap untouched
- [x] Reconciliation with `verify-esm-entrypoints.mjs` decided and cross-referenced in both headers
- [x] Neutralization 1 — webauthn `default` fix reverted → gate fails, exit 1
- [x] Neutralization 2a — build output excluded via `.npmignore` → gate fails, exit 1
- [x] Neutralization 2b — true 5.1.0-27 shape, no build output on disk → gate fails, exit 1
- [x] Neutralization 3 — `bin` naming an unpacked file → gate fails, exit 1
- [x] Wired into per-PR CI and all six publish workflows; all YAML validated
- [x] Findings filed (3 — #3 is a live defect the widened gate caught)
- [x] Docs: ledger, `docs/FUTURE.md`, consumer note
- [x] All three gates green together
- [x] `rush change --verify` green (change file added for the one `tools/` manifest fix)
- [x] `code-reviewer` run **before** any coverage work
- [x] Copilot round 1 — 4 comments, 3 actioned (1 substantive: `tools/` invisible to the gate), 1 declined
- [ ] Copilot round 2 — commissioned; round 1 was substantive, so not stopping on diminishing returns yet
- [ ] Rebase onto `release` once #603 + #605 land
