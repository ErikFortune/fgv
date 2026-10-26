# `agent-memory-atomic-writes` — atomic record writes and a single-writer guard for `FileTreeMemoryStore`

**Status:** shipped via #TBD into `integration/asks` (2026-10-26). Origin: personaility#700.

## What it delivered

- **Atomic record writes.** Every record file goes through `@fgv/ts-json-base`'s
  `writeChildAtomically` at the strongest guarantee the root lists (`'process-crash'` on a
  qualified Linux ext2/3/4 or tmpfs root, `'session'` in memory). A crash mid-write leaves the
  previous record whole. Proven on a real filesystem by interrupting the write partway: on the base
  the file was left holding `---\nid:`.
- **`store.durability`** — `{ atomic, guarantee?, reason, removedTemporaries }`, computed once at
  `create`. Roots without atomic writes degrade to plain writes and say so;
  `create({ durability: { require } })` refuses them instead.
- **No silent fallback, no lying failure.** A write that cannot honour the chosen guarantee fails.
  `'replaced'` is committed; `'unknown'` is settled by re-reading; the index follows the file.
- **One store per root per process.** A second store is refused until `dispose()`; a disposed store
  reads but no longer writes.
- **Open-time sweep** of interrupted-write working files, under the guard.
- **`IAtomicWriteCapabilities.reason`** in `@fgv/ts-json-base`, so the store can explain itself.

## Where to look

- `result.md` — the full change list, red-then-green evidence, and the check-then-act table.
- `brief.md` — the frozen contract. `state.md` — the working surface.
- Code: `libraries/ts-agent-memory/src/packlets/store/{storeFileAccess,storeRootSession,rootOwnership,openReport}.ts`;
  tests in `src/test/unit/store/durability.test.ts`.

## Left open

- The one unsettleable outcome: `'unknown'` followed by a failed re-read. The failure says the
  file may hold either record; a reopen settles it.
- Cross-process exclusivity remains a host deployment requirement.
- Follow-on: personaility#701 (compare-and-set) builds on the guard.
