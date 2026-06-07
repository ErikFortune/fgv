# State: `ai-assist-message-ordering`

**Phase:** complete — awaiting merge.
**Branch:** `ai-assist-message-ordering-impl` → PR #478 (base: `ai-assist-message-ordering` integration branch).
**Last commit:** `1c320630f`.

## Checklist

- [x] Design note pinned (`design.md`): unified shape, `AiPrompt` disposition, `continuationMessages` distinctness, proxy wire-contract change.
- [x] Implementation: `callProviderCompletion`, `callProviderCompletionStream`, `generateJsonCompletion`, `executeClientToolTurn`, proxy variants unified on ordered `messages[]`.
- [x] All in-repo callers migrated (`ts-app-shell` useAiAssist, four testbed `*ClientTools` scenarios, ts-extras tests).
- [x] Load-bearing symmetric-ordering regression test passes (Anthropic + OpenAI-shaped + Gemini).
- [x] `etc/ts-extras.api.md` regenerated; Rush change file added (`type: none`); `LIBRARY_CAPABILITIES.md` updated.
- [x] `rushx build` / `lint` / `test` (100%) green in `ts-extras`, `ts-app-shell`, `samples/testbed`; `fixlint` run.
- [x] `code-reviewer` (layer 1) run; findings resolved/dispositioned.
- [x] Copilot loop driven to convergence — stopped at round 4 on diminishing returns (R1–R3 substantive, R4 clean).
- [x] Follow-up tech debt captured (`apiClient.ts` decomposition, P3).
- [x] Promote task dir to `.ai/tasks/completed/2026-06/` (done pre-merge to save a commit).
- [ ] **Merge PR #478** (Erik).

## Open items

None blocking. Two intentional proxy-path asymmetries (temp/thinking conflict + client-side model resolution) are documented in `result.md` as server-side by design.
