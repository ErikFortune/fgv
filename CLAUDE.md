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

## Complex Task Orchestration

For complex multi-phase tasks (new features, major refactoring), the task-master workflow system is available in `.claude/agents/`. This provides:

- Structured requirements analysis with confirmation gates
- Design review phases
- Implementation coordination with specialized agents
- Automated and manual testing phases
- Artifact preservation for future reference

Workflow templates are in `.ai/workflows/`. Use task-master for:
- Multi-step features requiring coordination
- Major refactoring with behavior preservation
- Tasks benefiting from structured documentation

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
│   └── MONOREPO_GUIDE.md
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
