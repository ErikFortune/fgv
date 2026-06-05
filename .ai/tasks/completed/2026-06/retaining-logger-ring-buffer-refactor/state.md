# `retaining-logger-ring-buffer-refactor` — state

**Stream:** `retaining-logger-ring-buffer-refactor`
**Status:** queued — commission after the `ts-prompt-assist-observability` cluster closes to `release`
**Branch base:** current `release` HEAD at commission time
**Brief:** `.ai/tasks/active/retaining-logger-ring-buffer-refactor/brief.md`

---

## Commission trigger

When the `ts-prompt-assist-observability` cluster lands on `release` and `RetainingRingBuffer<T>` is available in `@fgv/ts-utils`, commission this stream.

---

## Phases (commission-time)

- [ ] Phase 1 — Read current `RetainingLogger` internals + `RetainingRingBuffer<T>` API
- [ ] Phase 2 — Refactor internals to compose the buffer; preserve public surface
- [ ] Phase 3 — Existing tests pass verbatim; `etc/ts-utils.api.md` regenerates clean
- [ ] Phase 4 — `code-reviewer` pass before coverage closure (L37)
- [ ] Phase 5 — Close gates; artifact migration in the same PR; squash to release

---

## Decisions made

(empty — agent records architectural decisions here when commissioned)

---

## Follow-up findings filed

(empty)
