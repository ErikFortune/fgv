# Stream brief — `agent-memory-mcp-server`

**Status: PROPOSED — conditional. Do not start until `task-corpus-index` has shipped and been
shown insufficient.** Drafted 2026-08-14.

## Motivation

`@fgv/ts-agent-memory` is, by design, exactly the substrate for indexing a corpus of markdown
so an agent can retrieve from it: FileTree-backed markdown + YAML frontmatter, per-kind typed
bodies, content-hash dedup, attributed edges, a retriever family, and optional record- and
fragment-granular semantic recall.

It is also, today, **unreachable from Claude Code**, and the gap is one of direction rather than
capability. Verified against source 2026-08-14:

- `createMemoryTools(...)` returns `ReadonlyArray<AiAssist.IAiClientTool>`
  (`libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts:693`). Those are for an
  **ai-assist tool loop** — a consumer driving a provider API — not for MCP.
- `@fgv/ts-extras-mcp` is an MCP **client**: it connects to a server, discovers tools, and
  adapts them *into* `IAiClientTool`. That is the opposite direction, and its README explicitly
  lists a server as out of scope.

So there is no path by which a Claude Code session reads a `ts-agent-memory` vault. The missing
piece is an MCP **server** that exposes the L2 tool surface over the protocol.

## Why this is worth doing *if* the cheap option falls short

Three things, in descending confidence:

1. **It is reusable beyond this repo.** Any Claude Code session, on any vault, on any machine.
   The task corpus is one consumer; PersonAIlity's knowledge vault is another.
2. **It dogfoods the library against a corpus we did not design for it.** 269 heterogeneous
   markdown files with no frontmatter is a realistic adoption shape, and it will surface seam
   gaps that our own synthetic fixtures do not. That is the same argument that made the
   PersonAIlity co-development valuable.
3. It closes a real asymmetry in the family: we ship an MCP client and no server.

## Why it is conditional, and what would make it unnecessary

The corpus is **3.1 MB across 269 files**. Grep is instant at that size and every agent already
has `Grep`/`Glob`/`Read`. The demonstrated problem is *discovery*, not retrieval — and a
generated index plus frontmatter may solve discovery outright for a fraction of the cost.

**Start this stream only when there is evidence the index was not enough** — a recorded instance
of a real question whose answer sat in the corpus and the index did not surface it. Without that
evidence this is a large build in search of a justification, and the honest default is not to
build it.

## Scope

### 1. New package: `@fgv/ts-agent-memory-mcp` (Node)

A **Result-integration boundary** in the established family shape (see
`LIBRARY_CAPABILITIES.md` § "Result-integration boundary — package shape convention"): thin
conversion, a small enumerated surface, an explicit NOT-in-scope list, no opinion added beyond
the conversion.

- Wraps `@modelcontextprotocol/sdk`'s **server** side. **All SDK imports isolated to one file**,
  per the precedent `ts-extras-mcp` set for the announced SDK v2 rename.
- `@modelcontextprotocol/sdk` and `@fgv/ts-agent-memory` as **peer dependencies**, matching
  `ts-extras-mcp` / `ts-extras-transformers`.
- Exposes the `createMemoryTools` suite (`memory_search` / `memory_read` / `memory_context` /
  `memory_write` / `memory_delete`) as MCP tools.

**The load-bearing design question is the adapter direction.** `IAiClientTool` carries
`parametersSchema: ISchemaValidator<TParams>` (`JsonSchema` from `@fgv/ts-json-base`) and
`execute: (args: unknown) => Promise<Result<unknown>>`. MCP wants a raw JSON Schema plus a
handler returning content blocks. `schema.toJson()` already emits draft-07, so the schema half
should be near-mechanical — **verify that before committing to the estimate**, because if it is,
the adapter is small and generic, and it belongs in this package as a reusable
`adaptClientToolsToMcp`, mirroring `adaptMcpTools` in the client package.

**Read-only by default.** `memory_write` / `memory_delete` must be opt-in, not in the default
tool set. An MCP server handed to an agent session is a write path into the corpus; the default
posture should be that it cannot mutate.

### 2. Ingest: task corpus → memory vault

A one-shot (re-runnable) ingest turning `.ai/tasks/**` into records.

- One `Kind` per artifact type (`stream-brief`, `stream-state`, `stream-result`,
  `stream-readme`, `stream-design`), each with a registered body Converter.
- Identity via a codec mapping `<stream-id>/<artifact>` → `{ scope, idStem }`. **No minted
  UUIDs** — the path is the domain address, per the library's own identity rule.
- `provenance.source` set to something stable and greppable (e.g. `'task-corpus-ingest'`) so
  the whole ingest is retractable in one query via the `provenanceSource` axis (#622).
- **Consumes the frontmatter from `task-corpus-index`** rather than re-deriving it. The two
  streams share that contract; this one must not fork its own parser.

### 3. Wiring and configuration

- A `.mcp.json` entry (or documented equivalent) so a Claude Code session can launch it.
- Vault root, read-only flag, and which tools are exposed all configurable.
- Semantic recall is **optional and off by default** — it needs an embedder, which means either
  a local model (`@fgv/ts-extras-transformers`) or a cloud call per record. Ship the
  keyword/structured retrievers first and treat semantic as a follow-on.

### 4. Documentation

- `LIBRARY_CAPABILITIES.md` entry, with the NOT-in-scope list, in the same shape as the other
  boundary packages.
- A note in `.ai/conventions/workflow/artifact-protocol.md` that the corpus is indexed and how
  to re-run the ingest.

## Explicitly NOT in scope

- **MCP resources / prompts / sampling.** Tools only, matching `ts-extras-mcp`'s cut.
- **A browser sibling.** MCP servers are a Node concern here.
- **Auth.** Local stdio transport; no OAuth, no managed auth.
- **Replacing `Grep`/`Read`.** This augments discovery; an agent should still read files
  directly. If the server becomes the *only* way to reach the corpus, that is a regression.
- **Indexing anything but `.ai/tasks/`** in v1 — though note `.ai/notes/` is where the
  branch-migration plan actually lived, so a v2 widening is foreseeable and the codec design
  should not preclude it.
- **Write-back of agent-authored memories** into the task corpus. The corpus is authored by the
  workflow; letting an agent write into it blurs provenance for no established need.

## Open questions

1. **Does `ISchemaValidator.toJson()` output drop straight into the MCP tool registration
   shape?** If yes, the adapter is trivial and the estimate holds. If it needs per-tool
   massaging, that changes the sizing — resolve this first, before any other work.
2. Vault-as-derived-artifact or vault-as-committed? Deriving it on demand keeps the repo clean
   but pays ingest cost per session; committing it makes the vault a reviewable artifact but
   adds churn to every PR that touches a task file.
3. Is `@fgv/ts-agent-memory-mcp` the right home, or should the generic
   `IAiClientTool` → MCP adapter live in `ts-extras-mcp` alongside its inverse, with this
   package holding only the vault wiring? (Leaning: adapter belongs beside its inverse.)
4. Semantic recall needs an embedder — local (`ts-extras-transformers`) or cloud
   (`AiAssist.callProviderEmbedding`)? Deferred with semantic itself.

## Gates

- [ ] `rushx build` / `rushx lint` / `rushx test` green in every modified package
- [ ] 100% coverage on the new package
- [ ] Change file for every touched package
- [ ] Repo-wide `rush rebuild` — this adds a package and touches shared contracts
- [ ] `code-reviewer` on the final diff before the first push
- [ ] Read-only default verified by test, not by inspection
- [ ] An end-to-end test that actually drives the server over the protocol, not just the
      adapter in isolation. Per `TESTING_GUIDELINES.md`, a suite that mocks the transport can
      hit 100% coverage while never proving the thing works — that is the documented
      `ai-assist-client-tools` failure mode and this stream has the same shape.

## Dependencies

- **`task-corpus-index` must ship first.** This stream consumes its frontmatter contract, and
  its outcome determines whether this stream is justified at all.
