# Agent System Design Notes

## Overview

This document contains design decisions, deferred optimizations, and operational notes for the FGV multi-agent development system.

## System Architecture

### Agent Definitions (`.claude/agents/`)
- **task-master.md** - Orchestrator with workflow management and escalation batching
- **tpm-agent.md** - Requirements analysis with mandatory confirmation gate
- **senior-developer.md** - Architecture & design with pattern enforcement
- **code-monkey.md** - Implementation craftsman focused on consistency
- **code-reviewer.md** - Enhanced dual-mode reviewer (standalone + workflow)
- **sdet-functional.md** - Behavior-focused functional testing
- **sdet-coverage.md** - Coverage gap analysis and classification
- **senior-sdet.md** - Test architecture and quality review specialist

### Runtime Infrastructure (`.agents/`)
- **tasks/** - Active and completed task execution artifacts
- **workflows/** - YAML workflow templates for different task types
- **patterns/** - Learned patterns and decision logs
- **AGENT_SYSTEM_NOTES.md** - This file

## Key Design Decisions

### 1. Mode-Aware Agents

**Decision**: All agents support both `standalone` and `workflow` modes.

**Rationale**:
- Reuse existing agents in orchestrated workflows
- Maintain ability to use agents directly for consultation
- Consistent behavior across different invocation contexts

**Implementation**:
```yaml
if context.mode == "workflow":
  # Structured input/output for task-master coordination
else:
  # Direct user interaction with detailed explanations
```

### 2. Requirements Confirmation Gate

**Decision**: Mandatory confirmation phase before any development work begins.

**Rationale**:
- Prevents wasted work from misunderstood requirements
- Ensures user and system have aligned understanding
- Catches ambiguities early in the process

**Implementation**: TPM agent has two phases:
1. `requirements_confirmation` (gate type - blocks until user approves)
2. `requirements_analysis` (detailed analysis proceeds after approval)

### 3. Intelligent Escalation Batching

**Decision**: Batch escalations to minimize user interruptions while ensuring clarity.

**Rationale**:
- Users prefer fewer, more comprehensive interruptions
- Context is preserved better when related issues are grouped
- System can continue work on unblocked items

**Batching Rules**:
- CRITICAL issues escalate immediately
- Related issues are grouped together
- Phase completion triggers batching
- Time limits prevent indefinite delays

### 4. Structured Context Passing

**Decision**: All agents communicate through structured TaskContext objects.

**Rationale**:
- Ensures consistent handoffs between agents
- Provides full audit trail of decisions
- Enables iteration and rework with proper context

**Context Structure**:
```typescript
interface TaskContext {
  task: { id, description, type, priority, complexity };
  artifacts: { requirements, design, implementation, review, tests, coverage };
  state: { currentPhase, completedPhases, iterations, blockers, decisions };
  feedback: { [agentName]: { issues, suggestions, needsRework } };
}
```

### 5. Anti-Pattern Prevention

**Decision**: Strong enforcement of established patterns, especially Result pattern and type safety.

**Rationale**:
- Maintains codebase consistency and quality
- Prevents accumulation of technical debt
- Leverages existing investment in patterns

**Key Enforcements**:
- No `any` type usage (will fail CI)
- No manual type checking (use Converters/Validators)
- Mandatory Result pattern for fallible operations
- Pattern consistency over individual preferences

### 6. Test Quality Triangle

**Decision**: Add Senior SDET agent for test architecture and quality review.

**Rationale**:
- Completes the quality triangle: Production code quality + Test correctness + Test architecture
- Prevents test technical debt and maintains test suite quality
- Provides educational value for testing best practices
- Catches test anti-patterns early (implementation testing, over-mocking, duplication)

**Scope Separation**:
- **Code Reviewer**: Production code patterns and quality
- **SDET Functional**: Test functional correctness and behavior validation
- **SDET Coverage**: Coverage gap analysis and classification
- **Senior SDET**: Test architecture, organization, and quality patterns

**Conditional Execution**:
- Required for complex features with significant test suites
- Optional for simple bug fixes
- Can run in parallel with code review to avoid bottlenecks
- Triggered by test complexity thresholds

## Deferred Optimizations

### Caching Strategy (Deferred)

**Decision**: Start without caching, measure actual performance, add if needed.

**Rationale**:
- Avoid premature optimization
- Most architectural knowledge is stable but implementation details are volatile
- Modern LLMs are fast enough for most analysis tasks

**Future Caching Approach** (if performance becomes an issue):
- Cache stable patterns, conventions, and project structure
- Always fresh-analyze task-specific implementation details
- Store in `.agents/patterns/architecture-cache.yaml`
- Implement lightweight cache verification
- Invalidate on major changes (package.json, new packages, refactors)

**Revisit When**:
- Senior Developer agent shows performance issues
- Repeated analysis becomes bottleneck
- Multiple tasks show identical analysis patterns

### Pattern Learning System (Future)

**Concept**: System learns from successful task patterns to improve future recommendations.

**Potential Implementation**:
- Track successful design decisions
- Identify common escalation patterns
- Learn user preferences over time
- Suggest improvements to workflows

**Blocked On**: Need data from real usage patterns first.

## Workflow Templates

### Available Workflows
- **standard-feature.yaml** - Complete feature development lifecycle
- **bugfix-fast.yaml** - Streamlined bug fix workflow
- **hotfix-emergency.yaml** - Emergency production fix workflow
- **refactor-major.yaml** - Systematic refactoring with behavior preservation
- **documentation.yaml** - Documentation creation and update workflow

### Workflow Selection Logic (DEFAULT TO STANDARD-FEATURE)

**CRITICAL: Always default to `standard-feature` workflow unless explicitly overridden**

```yaml
DEFAULT_WORKFLOW: standard-feature  # USE THIS UNLESS CLEARLY INAPPROPRIATE

Task Analysis:
  - Classify type (feature, bugfix, refactor, test, docs, hotfix)
  - Assess complexity (trivial, simple, moderate, complex)
  - Consider priority (low, medium, high, critical)

Workflow Selection Algorithm (MUST BE APPLIED IN THIS ORDER):
  1. User Override:
     - User explicitly requests specific workflow → use requested workflow

  2. Emergency Detection:
     - hotfix + critical → hotfix-emergency
     - Keywords: "EMERGENCY", "PRODUCTION DOWN", "CRITICAL FIX"

  3. Trivial Bug (ALL conditions required):
     - bugfix + trivial complexity
     - Single file change expected
     - No design required
     - Clear, obvious fix
     → bugfix-fast

  4. Documentation Only:
     - docs (no code changes) → documentation

  5. DEFAULT FOR ALL OTHER CASES:
     → standard-feature (ALWAYS USE THIS IF UNCERTAIN)

Important:
  - When complexity is unclear → standard-feature
  - When type is ambiguous → standard-feature
  - When user says "implement X" → standard-feature
  - When adding ANY new functionality → standard-feature
  - When enhancing existing features → standard-feature
```

## Quality Gates

### Phase Completion Criteria
Each workflow phase has explicit quality gates that must be met before proceeding:

- **Requirements**: All requirements documented, ambiguities resolved
- **Design**: Architecture defined, interfaces specified, patterns identified
- **Implementation**: Code written, builds successfully, follows design
- **Review**: No blocking issues, patterns correct, design followed
- **Functional Test**: Requirements tested, acceptance criteria met
- **Coverage**: 100% coverage, gaps classified, directives justified

### Iteration Limits
- Most phases allow 2-3 iterations maximum
- Prevents infinite loops while allowing necessary rework
- Escalation after iteration limits exceeded

## File Organization

### Task Artifacts
```
.agents/tasks/active/{task-id}/
├── context.json              # Current TaskContext
├── requirements.md           # TPM output
├── design.md                # Senior Developer output
├── implementation.md        # Code Monkey notes
├── review.md               # Code Reviewer findings
├── test-plan.md            # SDET Functional output
├── coverage.md             # SDET Coverage analysis
├── escalations.json        # Escalation tracking
└── history.jsonl           # Event log
```

### Completed Tasks
- Moved to `.agents/tasks/completed/{YYYY-MM}/`
- Organized by month for easy archival
- Maintains same structure as active tasks

## Operational Guidelines

### For Task-Master
1. Always analyze task before selecting workflow
2. Maintain audit trail in history.jsonl
3. Batch escalations intelligently
4. Ensure quality gates are met before phase transitions
5. Handle iterations gracefully with feedback context

### For Individual Agents
1. Detect mode from context (workflow vs standalone)
2. Produce structured output in workflow mode
3. Escalate appropriately based on severity
4. Never introduce new patterns without design guidance
5. Maintain consistency with existing codebase

### For Users
1. Invoke task-master for complex, multi-step tasks
2. Use individual agents for consultation and simple tasks
3. Expect confirmation gate for requirements
4. Respond to escalation batches promptly
5. Trust the system's pattern enforcement

## Success Metrics

### Quality Indicators
- Tasks complete without rework
- Escalations are relevant and actionable
- Code quality maintains or improves
- Pattern consistency across implementations
- Test coverage remains at 100%

### Efficiency Indicators
- Reduced back-and-forth between user and system
- Faster time from requirement to working implementation
- Fewer defects in delivered code
- Better adherence to established patterns

## Troubleshooting

### Common Issues

**Agent Communication Failures**:
- Check TaskContext structure integrity
- Verify all required artifacts are present
- Ensure mode is properly detected

**Escalation Batching Problems**:
- Review batching rules in task-master
- Check for timeout configurations
- Verify escalation severity classification

**Quality Gate Failures**:
- Review phase completion criteria
- Check for missing dependencies
- Verify iteration limits aren't being exceeded

**Pattern Enforcement Issues**:
- Verify code-reviewer anti-pattern detection
- Check existing pattern examples in codebase
- Ensure agents have access to pattern documentation

## Future Enhancements

### Planned Improvements
1. **Metrics Dashboard** - Track system performance and user satisfaction
2. **Pattern Evolution** - System suggests improvements to established patterns
3. **Workflow Optimization** - Learn from successful task patterns
4. **Integration Testing** - Automated validation of agent interactions

### Research Areas
1. **AI-to-AI Communication** - Optimizing structured communication between agents
2. **Context Compression** - Efficient ways to pass relevant context without overwhelming agents
3. **Dynamic Workflow Adaptation** - Modifying workflows based on task characteristics
4. **User Preference Learning** - Adapting system behavior to individual user preferences

---

This system represents a systematic approach to development workflow automation while maintaining human oversight and code quality standards. The design prioritizes consistency, quality, and user experience over raw automation speed.