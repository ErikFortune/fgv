# Phase 5a Requirements: Sessions — Production Mode Core Experience

**Date:** 2026-02-28
**Phase:** 5a (Production Mode — Sessions)
**Status:** Requirements Analysis Complete
**Strategy:** Filling Sessions First, Then Confection Sessions

---

## Executive Summary

Phase 5a delivers the core production session experience for Chocolate Lab Web. Users will be able to create, view, manage, and track production sessions from planning through completion. This phase focuses on the full session lifecycle, including creation from Library views, grouped list display, session detail with procedure checklist, status transitions, and group management.

**Strategic Approach:** Build filling sessions first to work out data model gaps, state tracking, and persistence patterns. Apply learnings to confection sessions in a second iteration within this phase.

**Known Risks:** Session entity model lacks granular state tracking beyond the top-level `status` property. Procedure step completion tracking and checklist progress will require new persistence model design.

---

## 1. Functional Requirements

### FR001: Session Creation from Library Views

**Priority:** HIGH
**Rationale:** Primary entry point for production workflows.

**Description:**
Users can create new production sessions directly from confection and filling recipe detail views in Library mode.

**Acceptance Criteria:**
- AC001.1: "Start Session" button appears in toolbar of confection detail views (Library mode)
- AC001.2: "Start Session" button appears in toolbar of filling detail views (Library mode)
- AC001.3: Clicking "Start Session" opens session creation modal with:
  - Session name field (pre-populated with suggested default: `"[Recipe Name] - [Date]"`)
  - Session ID field (auto-derived from name using kebab-case with date prefix, editable)
  - Tags field (optional, multi-value)
  - Group field (optional, format: `YYYY-MM-DD-tag`)
  - Initial status dropdown (defaults to `planning`)
- AC001.4: Session creation validates:
  - Session name is non-empty
  - Derived session ID is valid `BaseSessionId` format (YYYY-MM-DD-HHMMSS-suffix)
  - Group format matches `GroupName` converter if provided
- AC001.5: On successful creation:
  - Session persisted to default session collection
  - Toast notification appears: "Session created" with "Go to Session" link
  - User remains in Library mode (fire-and-forget pattern)
  - "Go to Session" link navigates to Production → Sessions → opened session
- AC001.6: Session is created with:
  - `status: 'planning'` (or user-selected initial status)
  - `createdAt` and `updatedAt` set to current timestamp
  - Full editing history initialized from source variation
  - Source variation ID recorded for linking back to Library

**Out of Scope:**
- Session templates or presets
- Batch session creation

---

### FR002: Session List View with Grouping

**Priority:** HIGH
**Rationale:** Primary navigation and organization interface for production sessions.

**Description:**
Sessions tab displays all sessions in a grouped list view with expandable groups, metadata display, and drill-down navigation.

**Acceptance Criteria:**
- AC002.1: Sessions tab accessible via Production → Sessions
- AC002.2: Sessions grouped by `session.group ?? session.status`:
  - Explicit group assignments take precedence over status-based grouping
  - Sessions without a group fall back to status-based grouping
- AC002.3: Group headers display:
  - Group name (group tag or status label)
  - Session count badge
  - Group metadata from `group-notes` journal entry (if exists):
    - Target date
    - Categorized notes preview (first note or summary)
  - Expand/collapse toggle
- AC002.4: Group headers are clickable to edit group notes (see FR006)
- AC002.5: Each session list item displays:
  - Session label (or derived name if no label)
  - Status badge with color coding (planning/active/committing/committed/abandoned)
  - Source recipe name (linked to Library view)
  - Created date
  - Last updated timestamp
  - Tags (if any)
- AC002.6: Clicking a session opens it in cascade (detail view)
- AC002.7: Empty state when no sessions exist:
  - Message: "No production sessions yet"
  - CTA: "Create your first session from a Library recipe"
- AC002.8: Groups are collapsible/expandable with state persisted in navigation store

**Dependencies:**
- SessionLibrary query methods (`getSessionsByStatus`, `getAllSessions`)
- Group-notes journal entry type (exists in ts-chocolate schema)

---

### FR003: Session Detail View with Recipe and Procedure Checklist

**Priority:** HIGH
**Rationale:** Core production experience — view recipe and track procedure progress.

**Description:**
Session detail view displays the produced recipe alongside a procedure checklist in a split-column layout. Procedure steps are checkable during `active` status, with checked state persisted.

**Acceptance Criteria:**
- AC003.1: Session detail view uses split layout within cascade column:
  - Top section: Recipe display (produced confection/filling with current editing state)
  - Bottom section: Procedure checklist (if procedure assigned)
- AC003.2: Recipe display shows:
  - Session label and status badge
  - Source recipe name (linked to Library)
  - Current ingredient list with resolved choices
  - Current yield/target weight
  - Mold selection (confections only)
  - Chocolate selections (confections only)
  - Categorized notes
- AC003.3: Procedure checklist displays when session has procedure:
  - All steps from assigned procedure
  - Checkbox for each step
  - Step name and description
  - Task references (if any)
  - Time constraints (if specified)
- AC003.4: Checklist interactivity by status:
  - `planning`: Checkboxes disabled (read-only preview)
  - `active`: Checkboxes enabled, clicking toggles checked state
  - `committed`/`abandoned`: Checkboxes disabled (historical record)
- AC003.5: Checked state persisted in session entity:
  - New field added to session model: `procedureProgress?: { [stepId: string]: { checked: boolean; timestamp?: string } }`
  - Checking/unchecking a step updates session entity and persists
  - Checked timestamp recorded when step marked complete
- AC003.6: Cascade drill-down from session detail:
  - Clicking ingredient opens ingredient detail in next column
  - Clicking filling slot (confections) opens filling detail
  - Clicking mold opens mold detail
  - Cross-mode drill-down maintains Production mode context (UX Plan §1)
- AC003.7: Session metadata section displays:
  - Session ID (read-only)
  - Created/updated timestamps
  - Group assignment (editable via dropdown)
  - Tags (editable)
  - Categorized notes (editable)

**New Data Model Requirements:**
- **DESIGN NEEDED:** Procedure progress tracking structure
  - Must persist checked state per step
  - Should record timestamps for audit trail
  - Needs to handle dynamic procedure changes (steps added/removed)
  - Recommend: `procedureProgress: Map<StepId, IStepProgress>` where `IStepProgress` includes `{ checked: boolean; checkedAt?: string }`

**Dependencies:**
- Produced* wrapper restoration from persisted session history
- Procedure resolution from session's current procedure assignment

---

### FR004: Session Lifecycle and Status Transitions

**Priority:** HIGH
**Rationale:** Enables workflow progression from planning through completion.

**Description:**
Sessions transition through defined lifecycle states with validation and state-appropriate actions available in each state.

**Acceptance Criteria:**
- AC004.1: Valid status transitions:
  - `planning` → `active` (Start Production)
  - `active` → `committed` (Commit Session)
  - `active` → `abandoned` (Abandon Session)
  - `planning` → `abandoned` (Abandon Session)
  - Intermediate state during save: `active` → `committing` → `committed`
- AC004.2: Transition actions in session detail toolbar:
  - `planning`: "Start Production" button (transitions to `active`)
  - `active`: "Commit Session" and "Abandon" buttons
  - `committed`/`abandoned`: No transition actions (read-only)
- AC004.3: "Start Production" (`planning` → `active`):
  - Updates `status` to `active`
  - Records `updatedAt` timestamp
  - Persists session entity
  - Shows toast: "Session started"
  - Enables procedure checklist interaction
- AC004.4: "Commit Session" (`active` → `committed`):
  - Validates session is complete (optional: all required steps checked)
  - Transitions status to `committing`
  - Constructs journal entry from session state (see FR007)
  - Displays journal entry preview modal for validation
  - On user confirmation:
    - Updates `status` to `committed`
    - Records `updatedAt` timestamp
    - Persists session entity
    - Shows toast: "Session committed"
    - NOTE: Journal entry NOT persisted in Phase 5a (no journal persistence yet)
- AC004.5: "Abandon" transition:
  - Confirmation modal: "Abandon this session? Work will not be saved to library."
  - On confirm:
    - Updates `status` to `abandoned`
    - Records `updatedAt` and optional abandonment reason
    - Persists session entity
    - Shows toast: "Session abandoned"
- AC004.6: Invalid transitions blocked with error message
- AC004.7: Status changes trigger ReactiveWorkspace notification for list refresh

**Constraint:**
- Journal entry creation deferred to Phase 5b (journal persistence infrastructure)
- Commit flow prepares journal entry but does not save it

---

### FR005: Session Group Management

**Priority:** MEDIUM
**Rationale:** Enables organizing related sessions (e.g., holiday production runs).

**Description:**
Sessions can be assigned to named groups for organization. Groups have optional metadata stored in `group-notes` journal entries.

**Acceptance Criteria:**
- AC005.1: Group assignment via session detail:
  - Group dropdown in metadata section
  - Lists existing groups (derived from other sessions + group-notes entries)
  - Allows creating new group with format validation (YYYY-MM-DD-tag)
  - Allows clearing group assignment (session falls back to status grouping)
- AC005.2: Group format validation:
  - Date portion: Valid ISO date (YYYY-MM-DD)
  - Tag portion: Kebab-case alphanumeric + hyphens
  - Full format matches `GroupName` converter
- AC005.3: Group name suggestions:
  - Autocomplete from existing groups
  - Show usage count for each group
- AC005.4: Group assignment changes:
  - Update `session.group` field
  - Persist session entity
  - Session moves to new group in list view
  - Shows toast: "Session moved to group [name]"
- AC005.5: Tag reuse handling:
  - If same tag used across different dates (e.g., "birthday" in March and July)
  - Group headers disambiguate by showing date alongside tag: "Birthday (2026-03-15)"
- AC005.6: Group deletion behavior:
  - Deleting last session in a group does not delete group-notes entry
  - Group-notes persist independently (can have notes for planned groups with no sessions yet)

**Dependencies:**
- GroupName converter in ts-chocolate common types
- Group-notes journal entry type

---

### FR006: Group Notes Editing

**Priority:** MEDIUM
**Rationale:** Provides context and planning information for session groups.

**Description:**
Group headers in session list allow inline editing of group metadata via `group-notes` journal entries.

**Acceptance Criteria:**
- AC006.1: Clicking group header opens inline group notes modal
- AC006.2: Group notes modal displays:
  - Group name (read-only, derived from group ID)
  - Target date field (optional)
  - Categorized notes editor:
    - Category dropdown (planning/production/results/general)
    - Note text field
    - Add/remove note buttons
- AC006.3: Saving group notes:
  - Creates or updates `group-notes` journal entry
  - Journal entry `baseId` derived from group identifier
  - Persists to default journal collection
  - Shows toast: "Group notes saved"
  - Group header refreshes to show new metadata
- AC006.4: Group notes persistence:
  - Stored as journal entry type `group-notes`
  - Contains: `{ type: 'group-notes', baseId: GroupName, timestamp, targetDate?, notes }`
  - Queryable via JournalLibrary (Phase 5b will add journal queries)
- AC006.5: Empty group notes:
  - Group without notes shows "(No notes)" in header
  - Clicking opens blank notes editor

**Dependencies:**
- Journal entity creation utilities
- Group-notes journal entry type (schema exists, needs runtime support)

**Note:** Group-notes journal entries are created in Phase 5a but not displayed in Journal tab (Journal UI is Phase 5b).

---

### FR007: Journal Entry Construction on Commit

**Priority:** MEDIUM
**Rationale:** Prepare production records for persistence in Phase 5b.

**Description:**
Committing a session constructs a journal entry capturing the production results. Entry is previewed but not persisted (no journal persistence in Phase 5a).

**Acceptance Criteria:**
- AC007.1: Commit flow constructs journal entry:
  - Entry type: `filling-production` or `confection-production`
  - Includes: source variation ID, produced recipe snapshot, yield, procedure progress
  - Includes: session notes (merged with produced recipe notes)
  - Timestamp: commit time
- AC007.2: Journal entry preview modal shows:
  - Entry type and timestamp
  - Source recipe (linked to Library)
  - Produced yield
  - Ingredient choices made
  - Procedure steps completed (from checklist)
  - Notes
- AC007.3: Preview modal actions:
  - "Commit" button: Confirms transition to `committed` status
  - "Cancel" button: Aborts commit, session remains `active`
- AC007.4: Journal entry available for inspection:
  - Stored in commit result for future use
  - Phase 5b will add persistence via `workspace.data.journals.addJournal(entry)`
- AC007.5: Entry construction uses existing session methods:
  - `EditingSession.toProductionJournalEntry()` for fillings
  - Equivalent confection method (to be implemented)

**Constraint:**
- Journal entry NOT persisted in Phase 5a
- Infrastructure placeholder for Phase 5b integration

---

### FR008: Filling Sessions (Phase 5a Iteration 1)

**Priority:** HIGH
**Rationale:** Simpler than confections — validate patterns before confection sessions.

**Description:**
Filling sessions are fully implemented first to work out state tracking, persistence, and UI patterns.

**Acceptance Criteria:**
- AC008.1: All session features working for filling sessions:
  - Creation from Library filling detail view
  - List display in grouped view
  - Detail view with recipe and procedure checklist
  - Status transitions (planning → active → committed/abandoned)
  - Group assignment and notes
  - Procedure progress tracking
  - Journal entry construction
- AC008.2: Filling session restoration from persisted state:
  - `EditingSession.fromPersistedState()` correctly restores undo/redo history
  - Procedure progress restored from session entity
  - UI reflects correct editing state
- AC008.3: Filling session editing during `active` status:
  - Users can modify ingredient amounts
  - Users can add/remove ingredients
  - Users can change target weight
  - Users can update notes
  - All edits recorded in undo/redo history
  - Edits persist when session saved
- AC008.4: Filling session data model validated:
  - `IFillingSessionEntity` schema sufficient for all data
  - Procedure progress field added and working
  - Editing history serialization/deserialization correct

**Success Criteria:**
- All functional tests pass for filling sessions
- No critical data model gaps identified
- Patterns documented for confection session implementation

---

### FR009: Confection Sessions (Phase 5a Iteration 2)

**Priority:** HIGH
**Rationale:** Apply learnings from filling sessions to confection sessions.

**Description:**
After filling sessions are complete and validated, implement confection sessions using proven patterns.

**Acceptance Criteria:**
- AC009.1: All session features working for confection sessions:
  - Creation from Library confection detail view
  - List display in grouped view (mixed with filling sessions)
  - Detail view with confection recipe and procedure checklist
  - Status transitions
  - Group assignment
  - Child filling session management (slots)
  - Journal entry construction
- AC009.2: Confection-specific features:
  - Mold selection display and editing
  - Chocolate selection (shell, enrobing) display and editing
  - Filling slot display with drill-down to child sessions
  - Yield editing (count and weight per piece)
- AC009.3: Confection session restoration from persisted state:
  - Child filling sessions restored and linked
  - Confection editing state (mold, chocolates, yield) restored
  - Procedure progress restored
- AC009.4: Confection session editing during `active` status:
  - Users can change mold (with weight impact preview)
  - Users can change chocolates
  - Users can adjust yield
  - Users can edit child filling sessions
  - All edits persist correctly

**Dependencies:**
- FR008 complete (filling sessions working)
- Confection editing session classes (exist in ts-chocolate)
- Confection-specific UI components

---

### FR010: Status Filter in Sidebar

**Priority:** MEDIUM
**Rationale:** Essential for navigating sessions by lifecycle phase.

**Description:**
Sidebar includes status filter for sessions tab (already defined in filterConfigs.ts).

**Acceptance Criteria:**
- AC010.1: Filter definition exists: `{ key: 'status', label: 'Status', multiple: false }`
- AC010.2: Status filter displays in sidebar when Sessions tab active
- AC010.3: Filter options:
  - All (default — shows all sessions)
  - Planning
  - Active
  - Committed
  - Abandoned
- AC010.4: Single-select behavior (radio buttons, not checkboxes)
- AC010.5: Selecting status filters session list:
  - Only sessions with selected status shown
  - Groups with no matching sessions are hidden
  - Empty state if no sessions match filter
- AC010.6: Filter state persisted per-tab in navigation store
- AC010.7: Clear filter button resets to "All"

**Dependencies:**
- Existing filter infrastructure (sidebar, useFilteredEntities hook)
- Status filter config already defined

---

## 2. Non-Functional Requirements

### NFR001: Performance

**Description:** Session list and detail views must perform well with realistic data volumes.

**Metrics:**
- Session list renders < 500ms for 100 sessions
- Session detail opens < 300ms
- Status transition completes < 200ms
- Filter application < 100ms

**Constraints:**
- Lazy index rebuilding in SessionLibrary ensures query performance
- React rendering optimizations (memoization, virtualization if needed)

---

### NFR002: Usability

**Description:** Session workflows must be intuitive for production use in kitchen environments.

**Requirements:**
- Touch-friendly targets (min 44x44px) for tablet use
- Clear status indicators (color + text, not color alone)
- Confirmation modals for destructive actions (abandon, delete)
- Toast notifications for all state changes
- Keyboard shortcuts (Escape to close cascade)

---

### NFR003: Data Integrity

**Description:** Session state must persist reliably without data loss.

**Requirements:**
- All session mutations trigger ReactiveWorkspace notification
- Session entity validation before persistence
- Editing history serialization preserves undo/redo stacks
- Procedure progress persisted atomically with session updates
- Failed persistence operations reported to user with retry option

---

### NFR004: Integration

**Description:** Sessions integrate cleanly with existing Library and Navigation infrastructure.

**Requirements:**
- Sessions use standard cascade navigation model
- Session creation respects workspace storage targets
- Cross-mode drill-down (session → Library entities) follows established patterns
- Filter infrastructure reused from Library tabs
- Toast and logging use existing ObservabilityContext

---

## 3. Exit Criteria

Phase 5a is complete when all numbered exit criteria are satisfied:

### EC001: Filling Session Lifecycle Complete (Blocking)
**Category:** Functional
**Verification:** Automated + Manual
**Responsible:** Developer + Senior SDET
**Evidence:** All acceptance criteria for FR001-FR008 pass automated tests. Manual walkthrough of filling session creation → planning → active → committed successfully completes.
**Blocking:** Yes

### EC002: Confection Session Lifecycle Complete (Blocking)
**Category:** Functional
**Verification:** Automated + Manual
**Responsible:** Developer + Senior SDET
**Evidence:** All acceptance criteria for FR009 pass automated tests. Manual walkthrough of confection session including child filling sessions successfully completes.
**Blocking:** Yes

### EC003: Session List Grouping Works (Blocking)
**Category:** Functional
**Verification:** Automated
**Responsible:** Developer
**Evidence:** Sessions group correctly by `group ?? status`. Group headers display metadata from group-notes entries. Expand/collapse state persists.
**Blocking:** Yes

### EC004: Procedure Checklist Interaction (Blocking)
**Category:** Functional
**Verification:** Manual
**Responsible:** Senior SDET
**Evidence:** During `active` status, procedure steps can be checked/unchecked. Checked state persists across session close/reopen. Timestamps recorded.
**Blocking:** Yes

### EC005: Status Transitions Validated (Blocking)
**Category:** Functional
**Verification:** Automated
**Responsible:** Developer
**Evidence:** All valid transitions succeed. Invalid transitions blocked. Session entity persists correctly. ReactiveWorkspace notifications trigger.
**Blocking:** Yes

### EC006: Group Management Works (Blocking)
**Category:** Functional
**Verification:** Manual
**Responsible:** Senior SDET
**Evidence:** Can create/assign/edit groups. Group notes save and display in headers. Tag disambiguation works for duplicate tags across dates.
**Blocking:** Yes

### EC007: Journal Entry Construction Previews (Blocking)
**Category:** Functional
**Verification:** Manual
**Responsible:** Senior SDET
**Evidence:** Commit flow constructs journal entry. Preview modal displays all expected fields. Entry contains correct data (no persistence validation yet).
**Blocking:** Yes

### EC008: Cross-Mode Cascade Drill-Down (Blocking)
**Category:** Integration
**Verification:** Manual
**Responsible:** Developer
**Evidence:** From session detail, can drill into ingredient/filling/mold. Cascade maintains Production mode context with visual differentiation.
**Blocking:** Yes

### EC009: Session Persistence Round-Trip (Blocking)
**Category:** Technical
**Verification:** Automated
**Responsible:** Developer
**Evidence:** Session saved to collection. Session restored with identical state (editing history, procedure progress). No data loss.
**Blocking:** Yes

### EC010: Status Filter Works (Non-Blocking)
**Category:** Functional
**Verification:** Manual
**Responsible:** Developer
**Evidence:** Status filter in sidebar filters session list correctly. Single-select behavior. State persists across tab switches.
**Blocking:** No

### EC011: Toast Notifications Present (Non-Blocking)
**Category:** Usability
**Verification:** Manual
**Responsible:** Developer
**Evidence:** All state changes show toast with appropriate message. "Go to Session" link works from creation toast.
**Blocking:** No

### EC012: Functional Test Coverage (Blocking)
**Category:** Validation
**Verification:** Automated
**Responsible:** Senior SDET
**Evidence:** Comprehensive functional tests exist for all session operations. Tests cover success cases, error cases, and edge cases. No expectation of 100% code coverage.
**Blocking:** Yes

### EC013: User Acceptance (Blocking)
**Category:** User Acceptance
**Verification:** User Verification
**Responsible:** User
**Evidence:** User successfully completes realistic workflow: Create filling session from Library → Transition to active → Check off procedure steps → Commit → Verify journal preview. Repeats for confection session.
**Blocking:** Yes

### EC014: Data Model Gaps Documented (Blocking)
**Category:** Technical
**Verification:** Manual
**Responsible:** Developer + TPM
**Evidence:** All data model gaps discovered during implementation are documented. Design decisions for procedure progress tracking are recorded. Known limitations noted for Phase 5b.
**Blocking:** Yes

---

## 4. Assumptions

### A001: Session Collections Exist
**Assumption:** Default session collection is configured in workspace settings or created automatically.
**Risk if False:** MEDIUM
**Validation:** Check workspace settings for default session collection target.

### A002: Group-Notes Journal Entry Type Exists
**Assumption:** `group-notes` journal entry type is defined in ts-chocolate schema and converters.
**Risk if False:** HIGH
**Validation:** Inspect `libraries/ts-chocolate/src/packlets/entities/journal/` for group-notes support.

### A003: EditingSession Restoration Works
**Assumption:** `EditingSession.fromPersistedState()` correctly restores editing history.
**Risk if False:** CRITICAL
**Validation:** Existing tests for EditingSession serialization/deserialization.

### A004: Procedure Resolution Available
**Assumption:** Sessions can resolve procedure from procedure ID to get steps for checklist display.
**Risk if False:** HIGH
**Validation:** Verify `workspace.data.entities.procedures.get(procedureId)` available in runtime.

### A005: Confection Editing Sessions Exist
**Assumption:** Confection editing session classes (MoldedBonBonEditingSession, etc.) are complete and functional.
**Risk if False:** HIGH
**Validation:** Review `libraries/ts-chocolate/src/packlets/user-library/session/confection*.ts`.

### A006: No Journal Persistence in Phase 5a
**Assumption:** Journal entry creation is sufficient without persistence for Phase 5a demo.
**Risk if False:** LOW (user confirmed this approach)
**Validation:** Phase 5b scope includes journal persistence infrastructure.

---

## 5. Constraints

### C001: No Batch Operations Beyond Status Transitions
**Type:** Business
**Description:** Batch delete, batch group assignment are explicitly out of scope.
**Impact:** Limits bulk management capabilities for large session sets.

### C002: No 100% Code Coverage Requirement
**Type:** Technical
**Description:** Focus on functional test quality, not coverage metrics.
**Impact:** May leave some defensive code paths untested (acceptable trade-off).

### C003: Filling Sessions Before Confection Sessions
**Type:** Implementation Strategy
**Description:** Filling sessions must be complete and validated before confection work begins.
**Impact:** Sequential development — no parallelization of filling vs confection work.

### C004: Journal Entries Not Persisted
**Type:** Technical
**Description:** Journal infrastructure (JournalLibrary CRUD, Journal tab) deferred to Phase 5b.
**Impact:** Cannot verify journal entries beyond preview modal in Phase 5a.

### C005: No Manual Session Ordering Within Groups
**Type:** UX
**Description:** Manual drag-to-reorder within groups marked as nice-to-have P1, not required for V1.
**Impact:** Sessions in groups appear in creation order (or status order if ungrouped).

---

## 6. Out of Scope

The following are explicitly excluded from Phase 5a:

1. **Batch Operations:** Batch delete, batch group assignment, batch export
2. **Advanced Procedure Features:** Timers, temperature tracking, "up next" preview
3. **Session Templates:** Pre-configured session setups for common scenarios
4. **Manual Session Ordering:** Drag-to-reorder sessions within groups
5. **Journal Persistence:** Saving journal entries to JournalLibrary (Phase 5b)
6. **Related Activity Panel:** Library view integration showing production activity (Phase 5c)
7. **Inventory Updates:** Ingredient/mold inventory tracking (Phase 5b)
8. **Session Export/Import:** Standalone session file export (future enhancement)
9. **Session Collaboration:** Multi-user concurrent editing (future)
10. **Session Analytics:** Production metrics, yield analysis (future)

---

## 7. Risk Analysis

### Risk R001: Procedure Progress Data Model Gap
**Severity:** HIGH
**Likelihood:** CONFIRMED
**Description:** Session entities currently lack granular state tracking beyond top-level `status` property. Procedure step completion, checklist progress, and timestamps require new data model design.

**Mitigation:**
- Design phase must propose procedure progress schema
- Schema must support: step-level checked state, timestamps, dynamic procedure changes
- Validate schema with persisted session round-trip tests before UI implementation
- Document schema design for future phases (journal entry inclusion)

**Fallback:**
- If complex schema proves problematic, defer step-level timestamps to Phase 5b
- Minimum viable: binary checked state per step, no timing data

---

### Risk R002: Filling-First Strategy Delays Confection Validation
**Severity:** MEDIUM
**Likelihood:** MEDIUM
**Description:** Building filling sessions first may uncover patterns that don't apply to confections, requiring rework when confections are implemented.

**Mitigation:**
- Review confection editing session classes during filling implementation
- Identify confection-specific state (mold, chocolates, child sessions) early
- Design procedure progress schema to accommodate both filling and confection sessions
- Keep filling implementation modular to allow confection-specific variations

**Fallback:**
- If confection sessions require significant rework, document as technical debt
- Prioritize working filling sessions over confection feature parity for Phase 5a delivery

---

### Risk R003: Session Restoration Complexity
**Severity:** MEDIUM
**Likelihood:** MEDIUM
**Description:** Restoring sessions from persisted state involves complex undo/redo history deserialization, procedure progress hydration, and child session linking (confections).

**Mitigation:**
- Comprehensive automated tests for session serialization/deserialization
- Test restoration with various editing histories (empty, full undo stack, mid-edit)
- Validate procedure progress restoration with missing/changed procedures
- Test confection restoration with orphaned child sessions

**Fallback:**
- If restoration fails, allow session to open in "degraded" mode with warning
- Provide manual recovery: "Start new session from current state"

---

### Risk R004: Group-Notes Schema Gaps
**Severity:** LOW
**Likelihood:** LOW
**Description:** Group-notes journal entry type may lack necessary fields or converters for metadata storage.

**Mitigation:**
- Verify group-notes schema early in design phase
- Confirm converters exist for group-notes CRUD
- Test group-notes creation/update before UI implementation

**Fallback:**
- If group-notes schema insufficient, store metadata in session entities temporarily
- Migrate to proper group-notes in Phase 5b when journal infrastructure complete

---

### Risk R005: Cross-Mode Cascade Complexity
**Severity:** LOW
**Likelihood:** LOW
**Description:** Cross-mode drill-down (Production → Library entities) may have edge cases with navigation state management.

**Mitigation:**
- Reuse existing cascade infrastructure from Library tabs
- Visual differentiation (background tone, breadcrumb) for cross-mode columns
- Navigation store already supports cross-mode context (mode field in cascade entries)

**Fallback:**
- If cross-mode cascade proves problematic, open Library entities in read-only "preview" mode within Production
- Full cross-mode editing deferred to polish phase

---

## 8. Dependencies

### Upstream (Must Exist Before Phase 5a)
- ReactiveWorkspace with session change notifications
- SessionLibrary with query methods (exists)
- Navigation store with cascade support (exists)
- Sidebar filter infrastructure (exists)
- Toast and logging via ObservabilityContext (exists)
- EditingSession classes for fillings (exist)
- Confection editing session classes (exist, need validation)

### Downstream (Blocked by Phase 5a)
- Phase 5b: Journal persistence, commit flow completion
- Phase 5b: Inventory updates on session commit
- Phase 5c: Related Activity panel in Library views

---

## 9. Success Metrics

Phase 5a is successful when:

1. **User can complete realistic workflow:** Create session from Library recipe → Plan → Execute (with procedure checklist) → Commit → Preview journal entry
2. **All blocking exit criteria satisfied:** EC001-EC009, EC012-EC014
3. **Zero critical bugs:** No data loss, no state corruption, no blocking UX issues
4. **Filling and confection sessions both working:** Full feature parity between session types
5. **Data model gaps documented:** Known limitations and design decisions recorded for future phases
6. **User acceptance:** User confirms feature meets production workflow needs

---

## 10. Design Phase Recommendation

**Recommendation:** **YES** — UX design phase is needed before implementation.

**Rationale:**

1. **Procedure Progress Data Model:** Requires design work to define schema, persistence strategy, and edge case handling (procedure changes, step additions/removals).

2. **Session Detail Split Layout:** UX Plan §6 describes "split within the column" for recipe + procedure checklist but doesn't specify exact layout. Design should clarify:
   - Fixed vs resizable split
   - Mobile/tablet responsive behavior
   - Checklist interaction patterns (expand/collapse, keyboard shortcuts)

3. **Journal Entry Preview Modal:** Needs design for what fields to display, how to present complex data (ingredient choices, procedure progress), and user affordances.

4. **Group Notes Editing UX:** Inline modal vs separate view needs design decision. Categorized notes editor pattern needs specification.

5. **Cross-Mode Visual Differentiation:** UX Plan mentions "slightly different background tone" but doesn't specify exact treatment.

**Design Phase Deliverables:**
- Procedure progress schema proposal with examples
- Session detail wireframes (split layout, checklist interaction)
- Journal preview modal design
- Group notes editor specification
- Cross-mode cascade visual treatment

**Design Phase Duration:** 2-3 days (focused design, not full UX research)

---

## 11. Implementation Strategy

### Iteration 1: Filling Sessions Foundation (Week 1-2)

**Goal:** Working filling sessions with all core features.

**Deliverables:**
1. Procedure progress data model design and implementation
2. Session creation modal and persistence
3. Session list view with grouping
4. Filling detail view with procedure checklist
5. Status transitions (planning → active → committed)
6. Group assignment and notes
7. Functional tests for filling sessions

**Validation Gate:** All FR008 acceptance criteria pass. User can create, execute, and commit filling session.

---

### Iteration 2: Confection Sessions (Week 3)

**Goal:** Confection sessions with feature parity to filling sessions.

**Deliverables:**
1. Confection session creation from Library
2. Confection detail view with mold/chocolate display
3. Child filling session management
4. Confection-specific editing (mold change, yield adjust)
5. Functional tests for confection sessions

**Validation Gate:** All FR009 acceptance criteria pass. User can create and execute confection session with child fillings.

---

### Iteration 3: Polish and Integration (Week 4)

**Goal:** Complete remaining features and finalize integration.

**Deliverables:**
1. Journal entry construction and preview
2. Cross-mode cascade drill-down
3. Status filter in sidebar
4. Toast notifications for all actions
5. Session restoration testing
6. User acceptance testing

**Validation Gate:** All exit criteria satisfied. User acceptance confirmed.

---

## 12. Open Questions for Design Phase

1. **Procedure Progress Schema:** Should we support per-step notes or just checked/timestamp? What happens if procedure changes after session starts?

2. **Session Naming:** Default name format is `"[Recipe Name] - [Date]"` — should date be full timestamp or just date? User preference?

3. **Group Deletion:** If user deletes all sessions in a group, should group-notes be preserved or auto-deleted?

4. **Checklist Visual Feedback:** Should checked steps be strikethrough, grayed out, or remain highlighted? Audio feedback for check action (kitchen environment)?

5. **Journal Preview Editing:** Should user be able to edit journal entry in preview modal before commit, or is it strictly read-only preview?

6. **Session ID Collision:** What happens if user-edited session ID collides with existing session? Auto-suffix or block?

7. **Child Session Lifecycle:** For confection sessions, should child filling sessions transition independently or always mirror parent status?

---

## Appendix A: Session Entity Schema (Current + Proposed)

### Current Schema (IFillingSessionEntity)

```typescript
interface IFillingSessionEntity {
  baseId: BaseSessionId;
  sessionType: 'filling';
  status: PersistedSessionStatus;
  createdAt: string;
  updatedAt: string;
  label?: string;
  notes?: ReadonlyArray<ICategorizedNote>;
  destination?: ISessionDestinationEntity;
  group?: GroupName;  // EXISTING — group support already in schema
  sourceVariationId: FillingRecipeVariationId;
  history: ISerializedEditingHistoryEntity<IProducedFillingEntity>;
}
```

### Proposed Addition: Procedure Progress

```typescript
interface IStepProgress {
  checked: boolean;
  checkedAt?: string;  // ISO timestamp when checked
  note?: string;       // Optional per-step note
}

// Add to IFillingSessionEntity and IConfectionSessionEntity:
interface ISessionEntityBase {
  // ... existing fields ...
  procedureProgress?: Record<StepId, IStepProgress>;
}
```

**Rationale:**
- `Record<StepId, IStepProgress>` allows sparse storage (only checked steps recorded)
- `checkedAt` timestamp provides audit trail
- Optional `note` field for future step-level annotations
- Survives procedure changes (orphaned step IDs ignored on display)

---

## Appendix B: File Locations

### New Files to Create

#### Chocolate Lab UI (chocolate-lab-ui)
- `libraries/chocolate-lab-ui/src/packlets/sessions/SessionListView.tsx` — Grouped session list
- `libraries/chocolate-lab-ui/src/packlets/sessions/SessionDetailView.tsx` — Session detail with split layout
- `libraries/chocolate-lab-ui/src/packlets/sessions/ProcedureChecklist.tsx` — Procedure step checklist component
- `libraries/chocolate-lab-ui/src/packlets/sessions/SessionCreationModal.tsx` — Modal for creating new session
- `libraries/chocolate-lab-ui/src/packlets/sessions/GroupNotesModal.tsx` — Group metadata editor
- `libraries/chocolate-lab-ui/src/packlets/sessions/JournalPreviewModal.tsx` — Journal entry preview before commit
- `libraries/chocolate-lab-ui/src/packlets/sessions/useSessionActions.ts` — Hook for session CRUD operations
- `libraries/chocolate-lab-ui/src/packlets/sessions/useSessionGrouping.ts` — Hook for grouping logic
- `libraries/chocolate-lab-ui/src/packlets/sessions/index.ts` — Packlet exports

#### Chocolate Lab Web (chocolate-lab-web)
- `apps/chocolate-lab-web/src/tabs/SessionsTab.tsx` — Sessions tab implementation

#### TS-Chocolate (ts-chocolate) — Data Model Extensions
- `libraries/ts-chocolate/src/packlets/entities/session/procedureProgress.ts` — Step progress types and converters

### Files to Modify

#### Chocolate Lab UI
- `libraries/chocolate-lab-ui/src/packlets/fillings/FillingDetailView.tsx` — Add "Start Session" button
- `libraries/chocolate-lab-ui/src/packlets/confections/ConfectionDetailView.tsx` — Add "Start Session" button

#### Chocolate Lab Web
- `apps/chocolate-lab-web/src/App.tsx` — Add SessionsTab to tab content router

#### TS-Chocolate
- `libraries/ts-chocolate/src/packlets/entities/session/model.ts` — Add `procedureProgress` field
- `libraries/ts-chocolate/src/packlets/entities/session/converters.ts` — Add procedure progress converter

---

## Appendix C: Testing Strategy

### Unit Tests
- Session entity serialization/deserialization with procedure progress
- Procedure progress schema validation (edge cases: missing steps, extra steps)
- Session grouping logic (group precedence over status)
- Status transition validation

### Integration Tests
- Session creation from Library recipe (filling and confection)
- Session persistence round-trip (save → restore → validate identical state)
- Group-notes journal entry CRUD
- ReactiveWorkspace notifications on session mutations

### Component Tests
- SessionListView: Grouping, filtering, expand/collapse
- ProcedureChecklist: Check/uncheck interaction, persistence
- SessionCreationModal: Name derivation, ID validation, tag input
- GroupNotesModal: Categorized notes editor

### End-to-End Functional Tests (Manual)
- **Filling Session Workflow:** Create → Plan → Start → Check steps → Commit → Preview journal
- **Confection Session Workflow:** Create → Edit mold → Edit filling → Check steps → Commit
- **Group Management:** Create group → Assign sessions → Edit notes → Verify header display
- **Cross-Mode Drill-Down:** Session → Ingredient → verify Library context maintained
- **Session Restoration:** Close session mid-edit → Reopen → Verify undo/redo intact

---

**End of Requirements Document**
