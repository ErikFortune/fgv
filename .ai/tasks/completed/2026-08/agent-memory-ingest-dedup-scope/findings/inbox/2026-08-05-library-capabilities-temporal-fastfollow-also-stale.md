# Finding — the `LIBRARY_CAPABILITIES` fast-follows list was stale in full, not just the two entries named

**Stream:** `agent-memory-ingest-dedup-scope`
**Severity:** low — docs accuracy
**Status:** fixed in this PR

## What the brief flagged

Deliverable 4 named two stale entries:

> The `@fgv/ts-agent-memory` entry lists the L3 ingest orchestrator and the L2 agent-tool surface
> under "**Fast-follows (seams present, impl pending)**". Both ship [...] **Verify what actually
> ships and move them; do not simply trust this brief's reading.**

## What verification found

The list had **three** items, and all three ship:

| Listed as pending | Actually ships | Evidence |
|---|---|---|
| temporal versioned write path + temporal retrievers | **yes** | `FileTreeMemoryStore._putVersioned` (`store/fileTreeMemoryStore.ts:1227`); `TemporalVersionedPolicy` (`types/writePolicy.ts:508`); `CurrentValidRetriever` / `AsOfRetriever` / `HistoryRetriever` (`retrieve/temporalRetrievers.ts:64,107,159`) |
| L2 agent-tool surface (`IAiClientTool`) | **yes** | `createMemoryTools` (`tools/memoryTools.ts:693`) returning `ReadonlyArray<AiAssist.IAiClientTool>`; five tools built at `:473-617`; exported via `packlets/tools/index.ts` |
| L3 ingest orchestrator | **yes** | `MemoryIngestOrchestrator` (`ingest/orchestrator.ts:196`); exported via `packlets/ingest/index.ts` |

All three reach the public surface through `src/index.ts` (`export * from './packlets/tools'`,
`'./packlets/ingest'`, `'./packlets/retrieve'`, `'./packlets/store'`).

The temporal entry is the one the brief did not flag — caught only because the brief said to verify
rather than trust it. Worth noting the instruction earned its keep.

## Action taken

Removed the "Fast-follows (seams present, impl pending)" clause entirely and folded all three into
**Shipped (v1)**, with an explicit "There are no outstanding fast-follows." Added substantive
Ingest (L3) and Agent-tools (L2) paragraphs, since both were previously described only as pending
and had no capability documentation a consumer could act on.

Edits are confined to the `@fgv/ts-agent-memory` entry — no surrounding content reflowed
(`safer-fetch-s3` holds other sections of the same file concurrently).
