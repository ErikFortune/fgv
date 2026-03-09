# AI Assistant Instructions

This directory contains unified instructions for AI coding assistants working with this repository. These guidelines apply to Claude, Windsurf, Cursor, Copilot, and any other AI tools.

## Quick Start

**For AI Assistants**: Read the instruction files in order of relevance to your current task:

1. **[CODING_STANDARDS.md](instructions/CODING_STANDARDS.md)** - Result pattern, TypeScript rules, validation patterns
2. **[TESTING_GUIDELINES.md](instructions/TESTING_GUIDELINES.md)** - Testing philosophy, coverage requirements, test matchers
3. **[CODE_REVIEW_CHECKLIST.md](instructions/CODE_REVIEW_CHECKLIST.md)** - What to check when reviewing code
4. **[MONOREPO_GUIDE.md](instructions/MONOREPO_GUIDE.md)** - Rush.js commands, dependencies, project structure

## Repository Overview

This is a Rush-based TypeScript monorepo containing libraries for internationalization, localization, and resource management. Key libraries:

| Library | Purpose |
|---------|---------|
| `@fgv/ts-utils` | Core utilities and Result pattern |
| `@fgv/ts-res` | Multidimensional resource management |
| `@fgv/ts-bcp47` | BCP47 language tag processing |
| `@fgv/ts-json` | JSON schema validation |
| `@fgv/ts-sudoku-lib` | Sudoku puzzle library |

## Critical Rules (All Tools)

These rules are **non-negotiable** and apply to all AI assistants:

### 1. Never Use `any` Type
```typescript
// ❌ NEVER - Will fail CI
const data: any = something;

// ✅ CORRECT
const data: unknown = something;
const data = something as unknown as SpecificType;
```

### 2. Use Result Pattern for Fallible Operations
```typescript
// ❌ NEVER throw in business logic
function parse(input: string): Data {
  if (!valid) throw new Error('Invalid');
  return data;
}

// ✅ CORRECT - Return Result<T>
function parse(input: string): Result<Data> {
  if (!valid) return fail('Invalid');
  return succeed(data);
}
```

### 3. Use Converters/Validators, Not Manual Type Checking
```typescript
// ❌ NEVER - Manual type checking with unsafe cast
if (typeof obj.name === 'string') {
  return succeed(obj as MyType);
}

// ✅ CORRECT - Use Converters
const converter = Converters.object<MyType>({
  name: Converters.string,
  value: Converters.number
});
return converter.convert(obj);
```

### 4. 100% Test Coverage Required
All code must have complete test coverage. Use `c8 ignore` directives only for truly unreachable defensive code.

## Common Commands

```bash
# Monorepo operations
rush install          # Install all dependencies
rush build            # Build all projects
rush test             # Test all projects

# Individual project (from project directory)
rushx build           # Build current project
rushx test            # Run tests
rushx coverage        # Run with coverage
rushx lint            # Check linting
rushx fixlint         # Auto-fix lint issues
```

## Directory Structure

```
.ai/
├── README.md                 # This file
├── instructions/             # Detailed coding guidelines
│   ├── CODING_STANDARDS.md   # Result pattern, TypeScript, validation
│   ├── TESTING_GUIDELINES.md # Testing philosophy and patterns
│   ├── CODE_REVIEW_CHECKLIST.md # Review criteria
│   └── MONOREPO_GUIDE.md     # Rush/pnpm/dependencies
├── workflows/                # Task orchestration workflows (YAML)
│   ├── standard-feature.yaml
│   ├── bugfix-fast.yaml
│   └── ...
└── tasks/                    # Runtime task artifacts
    ├── active/               # Currently running tasks
    ├── completed/            # Historical tasks
    └── task-log.jsonl        # Searchable task history
```

## Tool-Specific Configuration

Each AI tool has an adapter file that references these common instructions:

| Tool | Config File | Status |
|------|-------------|--------|
| Claude | `CLAUDE.md` | Primary |
| Windsurf | `.windsurfrules` | Supported |
| Cursor | `.cursorrules` | Supported |
| Copilot | `.github/copilot-instructions.md` | Supported |

## Complex Task Orchestration

For complex multi-phase tasks (new features, major refactoring), use the task-master workflow system. This provides:

- Structured requirements analysis
- Design review gates
- Implementation coordination
- Automated and manual testing phases
- Artifact preservation for future reference

See `workflows/` for available workflow templates.

## Questions?

If instructions are unclear or conflicting, ask the user for clarification rather than guessing.
