# Codex repository guidance

This is the Codex adapter for the repository's shared AI system. Claude continues
to use `CLAUDE.md` and `.claude/`; do not migrate, rename, or remove those files.
Shared behavior belongs in `.ai/` wherever possible.

## Required shared guidance

This is a Rush TypeScript monorepo. Before changing code, read the shared files
relevant to the task:

- `.ai/instructions/CODING_STANDARDS.md` for implementation.
- `.ai/instructions/TESTING_GUIDELINES.md` for tests and coverage.
- `.ai/instructions/CODE_REVIEW_CHECKLIST.md` for reviews and handoff.
- `.ai/instructions/MONOREPO_GUIDE.md` for packages, dependencies, and Rush.
- `.ai/instructions/ACTIVE_DEVELOPMENT.md` before choosing active APIs.
- `.ai/instructions/LIBRARY_CAPABILITIES.md` before general-purpose code.

Those files are authoritative. Critical session-start rules:

1. Never use `any`; use `unknown`, proper interfaces, branded types, and repository
   converters/validators.
2. Fallible operations return `Result<T>`; do not add exception-driven business logic.
3. Do not validate unknown data with unsafe casts; use converters/validators.
4. Maintain 100% coverage with meaningful tests. Never conceal real failures.
5. Use `rush add -p` and `rush remove -p`; do not use npm directly or hand-edit
   dependency entries.
6. Keep changes focused; do not add speculative features or unrelated refactors.

Common commands are `rush install`, `rush build`, `rush test`, and, from a project
directory, `rushx build`, `rushx test`, and `rushx coverage`.

## Skills

Codex discovers the canonical skills through `.agents/skills`, which points to
`.claude/skills`. Load applicable skills just in time:

- `filetree-io` for file I/O, walks, importers, and exporters.
- `ts-utils-logging` for diagnostics, logging, and boot paths.
- `value-hashing` for structural equality, deduplication, and object keys.
- `published-primitives-reflex` before writing utility-shaped code.
- `result-pattern` for `Result<T>` implementation or review.
- `result-tests` for tests and coverage.
- `type-safe-validation` for converters, validators, and type guards.
- `workstream-brief` for parallel workstream kickoff.
- `triage-cycle` for design-triage-implementation kickoff.
- `finalize-task` for closing workstreams or chore batches.

## Roles and orchestration

Canonical role prompts remain in `.claude/agents/`. They are behavioral documents,
not Codex tool grants. For a matching task, read the relevant role and preserve its
purpose, process, quality gates, stopping conditions, and output contract while
translating mechanics to available Codex capabilities:

- Parallel coordination: `.claude/agents/orchestrator.md`
- Structured single-task workflow: `.claude/agents/task-master.md`
- Test architecture: `.claude/agents/senior-sdet.md`
- Code review: `.claude/agents/code-reviewer.md`
- Worker roles: `.claude/agents/workflow-only/*.md`

Claude `Task`/subagent instructions mean delegate only when Codex delegation is
available and allowed. Claude tool lists, model names, and color metadata grant
nothing in Codex. `TodoWrite` maps to plan tracking, web tools map to Codex browsing,
and slash commands map to same-named skills.

Preserve shared workflow artifacts in `docs/WORKSTREAMS.md`, `docs/CHORES.md`,
`docs/TECH_DEBT.md`, `docs/FUTURE.md`, `.ai/tasks/`, `.ai/workflows/`, and
`.ai/conventions/workflow/`. Do not create a parallel Codex-only history.

## Coexistence rules

- Project config treats `CLAUDE.md` as a nested fallback where no `AGENTS.md` exists.
- Put cross-tool policy in `.ai/` and reference it from both entry points.
- Keep skills canonical in `.claude/skills/`; `.agents/skills` is only an alias.
- Keep role behavior canonical in `.claude/agents/` until a shared native format exists.
- If adapters disagree, consult the referenced `.ai/` source rather than guessing.
