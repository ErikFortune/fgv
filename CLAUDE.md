# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Quick Reference

This is a Rush-based TypeScript monorepo. Key commands:

```bash
rush install          # Install dependencies
rush build            # Build all projects
rush test             # Test all projects
rushx build/test      # Build/test current project (from project dir)
rushx coverage        # Run with coverage
```

## Core Instructions

All coding standards, testing guidelines, and review checklists are defined in the shared `.ai/` directory. These guidelines apply to all AI assistants and are the authoritative source:

@.ai/instructions/CODING_STANDARDS.md
@.ai/instructions/TESTING_GUIDELINES.md
@.ai/instructions/CODE_REVIEW_CHECKLIST.md
@.ai/instructions/MONOREPO_GUIDE.md
@.ai/instructions/ACTIVE_DEVELOPMENT.md

## Critical Rules Summary

These rules are **absolute and non-negotiable**:

1. **Never use `any` type** - Use `unknown`, branded types, or proper interfaces. Will fail CI.
2. **Use Result pattern** - All fallible operations return `Result<T>`, not exceptions
3. **Use Converters/Validators** - Never manual type checking with unsafe casts
4. **100% test coverage** - Required for all code

## Project Structure

### Libraries (`libraries/`)
| Library | Purpose |
|---------|---------|
| `@fgv/ts-utils` | Core utilities and Result pattern |
| `@fgv/ts-res` | Multidimensional resource management |
| `@fgv/ts-bcp47` | BCP47 language tag processing |
| `@fgv/ts-json` | JSON schema validation |
| `@fgv/ts-json-base` | Base JSON validation |
| `@fgv/ts-http-storage` | HTTP storage provider abstraction |
| `@fgv/ts-app-shell` | Shared React app shell primitives |
| `@fgv/ts-sudoku-lib` | Sudoku puzzle library |
| `@fgv/ts-extras` | Additional utilities |
| `@fgv/ts-utils-jest` | Jest testing utilities |

### Tools (`tools/`)
- `@fgv/ts-res-cli` - CLI for ts-res resource compilation

## Code Review

When reviewing code, use the checklist in [CODE_REVIEW_CHECKLIST.md](.ai/instructions/CODE_REVIEW_CHECKLIST.md). Key checks:

- No `any` type usage (Priority 1 - blocking)
- No manual type checking with unsafe casts (Priority 1)
- Result pattern used correctly (Priority 1)
- Proper error handling with context (Priority 2)
- Follows existing codebase patterns (Priority 2)

## Testing

Use Result matchers from `@fgv/ts-utils-jest`:

```typescript
expect(operation()).toSucceed();
expect(operation()).toSucceedWith(expectedValue);
expect(operation()).toFailWith(/error pattern/i);
expect(operation()).toSucceedAndSatisfy((result) => {
  expect(result.property).toBe(expected);
});
```

## When to load which skill

Load skills just-in-time when the relevant work surface is touched:

| Work surface | Skill |
|---|---|
| Any file I/O, directory walk, importer/exporter | `/filetree-io` |
| Any diagnostic output, logger construction, boot path | `/ts-utils-logging` |
| Any structural equality, dedup, object-as-map-key | `/value-hashing` |
| Any utility-shaped code ("feels general") | `/published-primitives-reflex` |
| Writing or reviewing `Result<T>`-returning code | `/result-pattern` |
| Writing or reviewing tests | `/result-tests` |
| Writing or reviewing converters, validators, type guards | `/type-safe-validation` |
| Extracting a stream brief for a parallel run | `/workstream-brief` |
| Drafting a design-triage-cycle kickoff | `/triage-cycle` |

## Complex Task Orchestration

For coordinating parallel workstreams, the **orchestrator** is available in `.claude/agents/orchestrator.md`. It maintains the artifact substrate, selects workflow shapes, composes kickoff briefs for worker agents, and closes the lessons loop. The orchestrator is designed for frontier-model sessions where the agent is coordinating, not implementing.

Three workflow shapes:

| Shape | When |
|---|---|
| `stream` | Substantial feature with a known shape — use `/workstream-brief` |
| `chore-batch` | Sequential walk through 3–6 small unrelated cleanup items |
| `design-triage-implement` | Feature needing design exploration first — use `/triage-cycle` |

Artifact substrate (maintained by the orchestrator):
- `docs/WORKSTREAMS.md` — in-flight and completed streams
- `docs/CHORES.md` — cleanup batches
- `docs/TECH_DEBT.md` + `docs/FUTURE.md` — deferred work
- `.ai/tasks/active/<id>/` → `.ai/tasks/completed/<YYYY-MM>/<id>/` — per-stream artifacts
- `.ai/BASELINE.md` — last `release` → `main` promotion (blast-radius sizing referent, not a stream-start gate)

Workflow conventions are in `.ai/conventions/workflow/`.

For single-agent structured tasks (requirements → design → implementation → review), the **task-master** is in `.claude/agents/task-master.md`. Workflow templates are in `.ai/workflows/`.

## Claude-Specific Notes

### Avoid Over-Engineering
- Only make changes that are directly requested
- Don't add features beyond what was asked
- Don't refactor surrounding code during bug fixes
- Keep solutions simple and focused

### Webpack Dev Mode
Webpack may not pick up library changes. If a web app fails to load:
1. Kill the dev server
2. Restart the application

### Package Management
Always use `rush add -p package-name` or `rush remove -p package-name`. Never use npm directly or edit package.json manually for dependencies.

## File Organization

```
.ai/                          # Shared AI assistant instructions
├── instructions/             # Coding standards (all AI tools)
│   ├── CODING_STANDARDS.md
│   ├── TESTING_GUIDELINES.md
│   ├── CODE_REVIEW_CHECKLIST.md
│   ├── MONOREPO_GUIDE.md
│   └── ACTIVE_DEVELOPMENT.md
├── workflows/                # Task orchestration workflows
└── tasks/                    # Runtime task artifacts

.claude/                      # Claude-specific configuration
├── agents/                   # Orchestration agents (task-master, etc.)
├── settings.local.json       # Permissions
└── project/                  # Project-specific design docs

CLAUDE.md                     # This file (Claude entry point)
.windsurfrules                # Windsurf adapter → .ai/
.cursorrules                  # Cursor adapter → .ai/
```

## Additional Resources

- The ts-res library has its own CLAUDE.md in `libraries/ts-res/`
- Project design docs are in `.claude/project/`
- Workflow templates are in `.ai/workflows/`
