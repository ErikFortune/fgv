# FGV Multi-Agent Development System

A comprehensive system of specialized Claude agents that work together to handle complex development tasks with systematic quality and consistency.

## Quick Start

### For Complex Tasks (Use Task-Master)
```
@task-master Please implement a user authentication system with email/password login
```

### For Simple Tasks (Use Individual Agents)
```
@code-reviewer Please review this implementation for Result pattern compliance
@sdet-functional Please create tests for this validation function
@senior-developer Please design an approach for caching user sessions
```

## System Overview

This system provides **8 specialized agents** that can work individually or together in orchestrated workflows:

### 🎯 **Task-Master** - Workflow Orchestrator
- **Use when**: Complex multi-step tasks requiring coordination
- **Capabilities**: Workflow management, escalation batching, quality gates
- **Output**: Coordinated execution across multiple agents

### 📋 **TPM Agent** - Requirements Analysis
- **Use when**: Need to clarify and document requirements
- **Capabilities**: Requirements confirmation gate, ambiguity detection, scope management
- **Output**: Structured requirements with acceptance criteria

### 🏗️ **Senior Developer** - Architecture & Design
- **Use when**: Need technical design and architecture guidance
- **Capabilities**: Pattern recognition, anti-pattern prevention, design documentation
- **Output**: Detailed design blueprints for implementation

### 🔨 **Code Monkey** - Implementation Craftsman
- **Use when**: Need precise implementation following established patterns
- **Capabilities**: Pattern consistency, quality craftsmanship, existing code mimicry
- **Output**: Clean, consistent, native-looking code

### 🔍 **Code Reviewer** - Quality Assurance
- **Use when**: Need code review for patterns and best practices
- **Capabilities**: Anti-pattern detection, Result pattern enforcement, educational feedback
- **Output**: Structured review findings with improvement guidance

### 🧪 **SDET Functional** - Behavior Testing
- **Use when**: Need comprehensive functional tests for requirements
- **Capabilities**: Requirements-driven testing, Result pattern test matchers, behavior validation
- **Output**: Complete functional test suites

### 📊 **SDET Coverage** - Coverage Analysis
- **Use when**: Need to achieve 100% coverage through gap analysis
- **Capabilities**: Gap classification, coverage directive recommendations, intelligent analysis
- **Output**: Classified coverage gaps with specific remediation plans

### 🏆 **Senior SDET** - Test Architecture & Quality
- **Use when**: Need test quality review, bug analysis, or manual validation planning
- **Capabilities**: Test architecture review, anti-pattern detection, bug triage, manual validation planning
- **Output**: Test quality assessment, bug analysis with workflow recommendations, manual testing plans

## Workflow Templates

The system includes pre-built workflows for common scenarios:

| Workflow | Use For | Duration | Agents Used |
|----------|---------|----------|-------------|
| **standard-feature** | New features requiring full lifecycle | 2-4 hours | All agents + test architecture review |
| **bugfix-fast** | Simple bug fixes | 30-60 minutes | Code Monkey + Reviewer |
| **hotfix-emergency** | Critical production issues | 15-30 minutes | Code Monkey + Streamlined Review |
| **refactor-major** | Significant refactoring with behavior preservation | 4-8 hours | All agents + behavior validation |
| **documentation** | Creating or updating documentation | 1-3 hours | TPM + Senior Dev + Code Monkey + Reviewer |

## Key Features

### 🚪 **Requirements Confirmation Gate**
All complex tasks start with a confirmation phase where the TPM agent reflects understanding and asks clarifying questions. **No development work begins until you approve the requirements understanding.**

### 📱 **Intelligent Escalation Batching**
The system groups related questions together to minimize interruptions while ensuring clarity. Critical issues escalate immediately, while related questions are batched for efficiency.

### 🔄 **Mode-Aware Agents**
Each agent works in two modes:
- **Standalone**: Direct consultation with detailed explanations
- **Workflow**: Structured coordination as part of task-master orchestration

### 🎯 **Quality Gates**
Each workflow phase has explicit quality criteria that must be met before proceeding. This ensures systematic quality and prevents issues from propagating downstream.

### 📋 **Pattern Enforcement**
Strong enforcement of established patterns, especially:
- **Result pattern** for all fallible operations
- **No `any` type** usage (enforced by CI)
- **Converters/Validators** instead of manual type checking
- **Consistent code style** matching existing patterns

### 📝 **Sequential Task Logging**
Automatic creation of searchable task logs for debugging and system understanding:
- **Business Context**: Why changes were made and their user impact
- **Technical Impact**: Components affected, API changes, database modifications
- **Risk Assessment**: Risk level and mitigation factors
- **Searchable History**: Command-line friendly format for correlating bugs with changes

## File Organization

```
Repository Root/
├── .claude/agents/           # Agent definitions
│   ├── task-master.md
│   ├── tpm-agent.md
│   ├── senior-developer.md
│   ├── code-monkey.md
│   ├── code-reviewer.md
│   ├── sdet-functional.md
│   ├── sdet-coverage.md
│   └── senior-sdet.md
│
└── .agents/                  # Runtime artifacts
    ├── tasks/                # Task execution data
    │   ├── active/           # Currently running tasks
    │   └── completed/        # Historical tasks
    ├── workflows/            # Workflow templates
    ├── patterns/             # Learned patterns
    ├── task-log.jsonl        # Sequential task log for debugging
    ├── task-log-index.json   # Searchable index for task log
    ├── task-log-schema.json  # Schema for task log entries
    └── AGENT_SYSTEM_NOTES.md # Design decisions
```

## Usage Examples

### Example 1: New Feature Development
```
User: @task-master I need to add a caching layer to improve API performance

Task-Master: I'll help you implement a caching layer. Let me start with requirements analysis.

TPM Agent: ## Requirements Understanding Checkpoint
**Your Request:** Add a caching layer to improve API performance

**My Understanding:**
I understand you want to add caching functionality to improve API response times by:
- Reducing database queries for frequently accessed data
- Storing computed results for reuse
- Implementing cache invalidation strategies

**Clarifying Questions:**
1. **Cache Scope:** Which APIs need caching?
   - Default assumption: All read-heavy endpoints
2. **Storage:** Should we use Redis or in-memory caching?
   - Default assumption: Redis for distributed caching
3. **TTL Strategy:** How long should cached data live?
   - Default assumption: 5 minutes for most data

**Please confirm:** Should I proceed with these assumptions?

User: Yes, proceed with Redis and focus on user data endpoints

[System continues through design, implementation, review, and testing phases]
```

### Example 2: Bug Fix
```
User: @task-master Fix the email validation that's rejecting valid .museum domains

Task-Master: This looks like a simple bug fix. I'll use the fast-track workflow.

[Code Monkey implements fix → Reviewer checks patterns → Optional tests if needed]
```

### Example 3: Direct Agent Consultation
```
User: @senior-developer How should I structure the caching layer for user sessions?

Senior Developer: For user session caching, I recommend this approach:

**Architecture Pattern**: Repository with Cache Decorator
**Components**:
- `UserSessionRepository` (interface)
- `DatabaseUserSessionRepository` (primary storage)
- `CachedUserSessionRepository` (cache decorator)

[Detailed design follows with rationale and examples]
```

### Example 4: Bug Analysis
```
User: @senior-sdet Users are reporting that CSV exports are failing with timeout errors

Senior SDET: I'll analyze this bug to determine the appropriate workflow.

## Bug Analysis Results

**Reproduction Status:** Confirmed
- Issue occurs with exports containing >1000 records
- Timeout happens after exactly 30 seconds
- Error message: "Request timeout while generating CSV"

**Root Cause Hypothesis:**
- Primary: CSV generation is synchronous and blocking for large datasets
- Secondary: Database query not optimized for large result sets

**Affected Components:**
- `ExportService.generateCSV()`
- `OrderRepository.findAllByDateRange()`
- `CSVFormatter.formatData()`

**Workflow Recommendation:** `bugfix-fast`
- Issue is reproducible and well-defined
- Fix likely involves async processing or pagination
- No major architecture changes needed

**Manual Validation Required:**
- Test CSV export with various file sizes (100, 1000, 5000 records)
- Verify file downloads correctly in different browsers
- Confirm exported data integrity

**Next Steps:** Execute bugfix-fast workflow with focus on async processing
```

### Example 5: Manual Validation Planning
```
User: @senior-sdet We're implementing payment processing - what manual testing do we need?

Senior SDET: For payment processing, you'll need comprehensive manual validation:

## Manual Testing Plan

**Payment Flow Validation:**
1. **Test Payment Processing** (30 minutes)
   - Process payment with valid test card
   - Verify payment confirmation appears
   - Check transaction in payment gateway dashboard
   - Test declined card scenarios

2. **Refund Process** (15 minutes)
   - Initiate refund through admin interface
   - Verify refund appears in gateway
   - Confirm user receives refund notification

3. **Cross-Browser Testing** (45 minutes)
   - Test payment flow in Chrome, Firefox, Safari, Edge
   - Verify 3D Secure popup handling
   - Check mobile responsive payment forms

**Total Estimated Time:** 90 minutes
**Recommended Tester:** Someone with access to payment gateway test environment
**Prerequisites:** Test payment cards and gateway access configured
```

## Best Practices

### When to Use Task-Master
- ✅ Multi-step tasks requiring coordination
- ✅ New features with requirements uncertainty
- ✅ Complex refactoring projects
- ✅ Tasks involving multiple components

### When to Use Individual Agents
- ✅ Specific consultation needs
- ✅ Single-focus tasks (just review, just test, etc.)
- ✅ Learning about patterns and best practices
- ✅ Quick guidance on specific topics

### Working with the System
1. **Be specific** in your initial request to help with workflow selection
2. **Respond promptly** to escalation batches to maintain momentum
3. **Trust the pattern enforcement** - it maintains codebase consistency
4. **Use the confirmation gate** to ensure alignment before work begins

## Troubleshooting

### Common Issues

**"Requirements confirmation seems unnecessary for simple tasks"**
- Use individual agents directly for simple consultation
- Task-master is designed for complex, multi-step work

**"Too many questions in the confirmation phase"**
- The system prioritizes clarification over assumptions
- This prevents expensive rework later in the process

**"Agent says my code violates patterns"**
- The system enforces established codebase patterns strictly
- This maintains consistency and quality across the codebase
- See `.agents/code-reviewer.md` for detailed pattern guidelines

**"Coverage analysis seems overly detailed"**
- The system distinguishes between functional code and defensive code
- This ensures 100% coverage through meaningful tests, not just coverage gaming

## Task Logging System

The system maintains a sequential log of all completed tasks to support debugging and system understanding. This creates a searchable history that correlates code changes with business context.

### What Gets Logged

Each completed task creates a structured log entry containing:

**Business Context** (from TPM Agent):
- Why the change was needed from user/business perspective
- Level of impact on end users (none/low/medium/high)
- Concise description of what was accomplished

**Technical Impact** (from Senior Developer):
- Components/services/files that were modified
- API changes (breaking changes, new/modified endpoints)
- Database changes (migrations, schema changes)
- Integration points with external systems

**Risk Assessment** (from Senior SDET):
- Overall risk level (low/medium/high/critical)
- Specific risk factors (new dependencies, auth changes, etc.)
- Validation status (automated tests, manual validation, performance)

### Usage Examples

#### Find Recent Authentication Changes
```bash
# Search for auth-related changes
grep "auth\|login\|session" .agents/task-log.jsonl | tail -5

# Find changes to UserService in last 30 days
grep "UserService" .agents/task-log.jsonl | grep "$(date -d '30 days ago' +%Y-%m)"
```

#### Identify High-Risk Changes
```bash
# Find high-risk or critical changes
grep '"level":"high"\|"level":"critical"' .agents/task-log.jsonl

# Find breaking API changes
grep '"breaking":true' .agents/task-log.jsonl
```

#### Correlate Issues with Recent Changes
```bash
# When login issues started last week, find recent session-related changes
grep "session\|auth" .agents/task-log.jsonl | grep "2024-01-1[5-9]"

# Find what changed in a specific component recently
grep "OrderService" .agents/task-log.jsonl | tail -3 | jq '.summary'
```

### Log Entry Format

Each entry is a single-line JSON object with this structure:
```json
{
  "task_id": "task-20240120-001",
  "timestamp": "2024-01-20T15:45:00Z",
  "type": "feature",
  "summary": "Added Redis caching layer for user session data",
  "business_rationale": "Improve API response times from 500ms to <100ms",
  "user_impact": "medium",
  "components_affected": ["UserSessionService", "RedisCache"],
  "api_changes": {
    "breaking": false,
    "modified_endpoints": ["/api/users/session"]
  },
  "risk_assessment": {
    "level": "medium",
    "factors": ["new_external_dependency", "session_handling_changes"]
  },
  "validation": {
    "automated_tests": true,
    "manual_validation_completed": true,
    "performance_validated": true
  },
  "artifacts_path": ".agents/tasks/completed/2024-01/task-20240120-001/",
  "tags": ["performance", "caching", "redis", "session"]
}
```

### Benefits

1. **Bug Correlation**: "Login issues started last week" → find recent auth changes
2. **Impact Assessment**: "What changed in UserService recently?" → see modifications and risk
3. **Release Planning**: Review cumulative risk of recent changes
4. **System Understanding**: Track how architecture evolved over time
5. **Debugging Context**: Understand why changes were made when investigating issues

### Log Maintenance

- **Active Log**: `task-log.jsonl` contains current year entries
- **Search Tools**: Command-line friendly (grep, jq, standard Unix tools)
- **Index**: `task-log-index.json` provides quick lookups by component, date, risk level
- **Schema**: `task-log-schema.json` documents the complete entry format

The task logging system runs automatically - every workflow completion adds an entry, creating a comprehensive development history for future debugging and system understanding.

## System Design Notes

For detailed information about design decisions, deferred optimizations, and operational guidelines, see:
- **`.agents/AGENT_SYSTEM_NOTES.md`** - Complete design documentation
- **`.agents/workflows/`** - Workflow template definitions
- **`.claude/agents/`** - Individual agent specifications

---

This system represents a systematic approach to development workflow automation while maintaining human oversight and code quality standards. It's designed to scale from simple consultations to complex multi-phase development projects.