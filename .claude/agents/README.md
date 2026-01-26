# Claude Agents

This directory contains Claude-specific agent definitions for task orchestration.

## Directory Structure

```
agents/
├── README.md           # This file
├── task-master.md      # Standalone: Complex workflow orchestration
├── senior-sdet.md      # Standalone: Test architecture and quality review
└── workflow-only/      # Sub-agents invoked only by task-master
    ├── tpm-agent.md         # Requirements analysis
    ├── senior-developer.md  # Architecture & design
    ├── ux-designer.md       # UX design
    ├── code-monkey.md       # Implementation
    ├── code-reviewer.md     # Code review (see note below)
    ├── sdet-functional.md   # Functional testing
    ├── sdet-coverage.md     # Coverage analysis
    ├── o11y-expert.md       # Observability
    └── test-coverage-expert.md
```

## Standalone Agents

These agents can be invoked directly for complex tasks:

### task-master
Use for complex multi-phase tasks requiring coordination:
- New feature development
- Major refactoring
- Tasks needing structured artifacts and quality gates

### senior-sdet
Use for complex test architecture decisions:
- Test suite quality review
- Bug triage and analysis
- Manual validation planning

## Workflow-Only Agents

Agents in `workflow-only/` are **sub-agents** invoked by task-master during workflow execution. They're not intended for direct use.

## Inline Capabilities

Many common tasks **no longer require spawning an agent**:

| Task | Use Instead |
|------|-------------|
| Code review | `.ai/instructions/CODE_REVIEW_CHECKLIST.md` |
| Coverage analysis | `.ai/instructions/TESTING_GUIDELINES.md` |
| Coding standards | `.ai/instructions/CODING_STANDARDS.md` |
| Monorepo guidance | `.ai/instructions/MONOREPO_GUIDE.md` |

The guidelines in `.ai/instructions/` are imported into CLAUDE.md and provide all the information needed for these tasks without agent overhead.

## When to Use Agents vs Inline

**Use task-master when:**
- Task has multiple phases (requirements → design → implementation → testing)
- You want structured artifacts preserved
- Task benefits from quality gates and checkpoints
- Complex refactoring with behavior preservation

**Use inline instructions when:**
- Simple code review
- Quick coverage analysis
- Single-phase implementation tasks
- Questions about patterns or standards
