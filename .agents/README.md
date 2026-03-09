# .agents/ Directory - DEPRECATED

> **This directory structure has been reorganized.** Most content has moved to `.ai/` for cross-tool compatibility.

## New Locations

| Old Location | New Location | Purpose |
|--------------|--------------|---------|
| `.agents/MONOREPO_GUIDELINES.md` | `.ai/instructions/MONOREPO_GUIDE.md` | Rush/pnpm guidance |
| `.agents/RESULT_PATTERN_GUIDE.md` | `.ai/instructions/CODING_STANDARDS.md` | Result pattern |
| `.agents/COVERAGE_GUIDELINES.md` | `.ai/instructions/TESTING_GUIDELINES.md` | Coverage & testing |
| `.agents/code-reviewer.md` | `.ai/instructions/CODE_REVIEW_CHECKLIST.md` | Review checklist |
| `.agents/workflows/` | `.ai/workflows/` | Workflow templates |
| `.agents/tasks/` | `.ai/tasks/` | Task artifacts |

## What Remains Here

This directory is kept for backwards compatibility but will be removed in a future cleanup. Files here may be outdated.

### Historical Task Logs (Deprecated)
- `task-log.jsonl` - Now at `.ai/tasks/task-log.jsonl`
- `task-log-index.json` - Now at `.ai/tasks/task-log-index.json`
- `task-log-schema.json` - Now at `.ai/tasks/task-log-schema.json`

### Agent System Notes (Reference Only)
- `AGENT_SYSTEM_NOTES.md` - Historical design decisions (see `.claude/agents/README.md` for current)

## Current System Structure

The AI assistant system is now organized as:

```
.ai/                              # Cross-tool instructions
├── instructions/                 # Coding standards (all tools)
├── workflows/                    # Task orchestration templates
└── tasks/                        # Runtime artifacts

.claude/                          # Claude-specific
├── agents/                       # task-master, senior-sdet
│   └── workflow-only/            # Sub-agents for task-master
├── project/                      # Project design docs
└── settings.local.json           # Permissions

CLAUDE.md                         # Claude entry point
.windsurfrules                    # Windsurf adapter
.cursorrules                      # Cursor adapter
.github/copilot-instructions.md   # Copilot adapter
```

## Migration Notes

- **Common tasks** (code review, coverage analysis) now use inline instructions from `.ai/instructions/`
- **Complex tasks** still use task-master from `.claude/agents/`
- **Other AI tools** (Windsurf, Cursor, Copilot) now have their own adapters pointing to `.ai/`
