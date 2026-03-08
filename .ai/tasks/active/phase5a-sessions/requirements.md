# Phase 5a Sessions Feature - Requirements Document

**Task ID**: phase5a-sessions
**Created**: 2026-02-28
**Workflow**: standard-feature
**Status**: requirements-confirmed

---

## Executive Summary

Implement the core Sessions functionality for Production mode in Chocolate Lab Web. This enables users to create production sessions from Library recipes, manage them through their lifecycle (planning → active → committed/abandoned), organize them into groups, and track work through procedure checklists.

This is the first Production mode feature and establishes patterns for production workflow UI.

---

## Functional Requirements

### FR-1: Session Creation from Library

**Description**: Users can create production sessions from confection and filling recipes in Library mode.

**Acceptance Criteria**:
- AC-1.1: "Start Session" action available on confection detail views in Library mode
- AC-1.2: "Start Session" action available on filling detail views in Library mode
- AC-1.3: Clicking "Start Session" creates session in background with `planning` status
- AC-1.4: Session initialized with editing history from source recipe variation
- AC-1.5: User remains in Library mode (fire-and-forget interaction)
- AC-1.6: Toast notification displays "Session created" with "Go to Session" link
- AC-1.7: "Go to Session" link navigates to Production → Sessions tab and opens session in cascade

**Implementation Notes**:
- Action can be rudimentary (simple button/link). Polish deferred to later task.
- Must add action UI to existing Library confection/filling detail components

### FR-2: Session List View

**Description**: Sessions tab displays all sessions in a grouped, filterable list.

**Acceptance Criteria**:
- AC-2.1: Sessions grouped by `session.group ?? session.status`
- AC-2.2: Group headers display group name or status label
- AC-2.3: Group headers show metadata from `group-notes` journal entries (if group exists)
- AC-2.4: Sessions within groups display name, status, created date
- AC-2.5: Clicking a session opens it in the cascade
- AC-2.6: Empty state displays when no sessions exist with "Create your first session" CTA
- AC-2.7: Status filter in sidebar filters sessions by status
- AC-2.8: Search in sidebar filters sessions by name/notes

**Implementation Notes**:
- Use `useEntityList` hook pattern from Library tabs
- Leverage existing sidebar filter infrastructure
- Filter config already exists in `filterConfigs.ts`

### FR-3: Session Detail View

**Description**: Session detail displays the produced recipe and procedure checklist.

**Acceptance Criteria**:
- AC-3.1: Split layout shows recipe display on left, procedure checklist on right
- AC-3.2: Recipe display shows current editing state (produced confection/filling)
- AC-3.3: Procedure checklist displays steps from session's procedure
- AC-3.4: Steps are non-interactive during `planning` status
- AC-3.5: Steps become tickable checkboxes during `active` status
- AC-3.6: Checked steps persist with session state
- AC-3.7: Session metadata displayed: status, created date, updated date, notes, group
- AC-3.8: Session notes editable in-place
- AC-3.9: Recipe remains editable during all non-committed statuses

**Implementation Notes**:
- Split within single cascade column (not separate columns)
- Rehydrate `Produced*` wrapper from persisted `ISerializedEditingHistoryEntity`
- Investigate session persistence format — may need adjustments

### FR-4: Session Lifecycle Management

**Description**: Users can transition sessions through lifecycle states.

**Acceptance Criteria**:
- AC-4.1: Valid transitions: `planning` → `active`, `active` → `committed`, any → `abandoned`
- AC-4.2: Transition actions available in session detail toolbar
- AC-4.3: `committing` intermediate state displays during save operation
- AC-4.4: Cannot transition if validation fails (recipe incomplete, procedure missing, etc.)
- AC-4.5: Committed sessions become read-only
- AC-4.6: Abandoned sessions become read-only
- AC-4.7: Status changes update session list grouping immediately

**Implementation Notes**:
- Use ReactiveWorkspace to propagate status changes
- Validation rules may need refinement based on session data model investigation

### FR-5: Session Groups

**Description**: Users can organize sessions into groups with shared metadata.

**Acceptance Criteria**:
- AC-5.1: Session can have optional `group` field (format: `YYYY-MM-DD-tag`)
- AC-5.2: Group field editable on session detail view
- AC-5.3: Group-notes journal entry created/updated when group metadata edited
- AC-5.4: Group header in session list is clickable
- AC-5.5: Clicking group header opens group-notes editor (modal or inline)
- AC-5.6: Group-notes fields: target dates, notes, group metadata
- AC-5.7: Tag reuse across dates handled (show date + tag in UI for disambiguation)
- AC-5.8: Ungrouped sessions fall back to status-based grouping

**Implementation Notes**:
- Group-notes are journal entries — use journal entity structure
- Include note editing from beginning (not deferred)
- Consider validation for group field format

### FR-6: Cross-Mode Cascade Drill-Down

**Description**: Users can drill down from sessions to underlying Library entities.

**Acceptance Criteria**:
- AC-6.1: Can open confection from session detail
- AC-6.2: Can drill into filling from confection view
- AC-6.3: Can drill into ingredient from filling view
- AC-6.4: Mode indicator stays on "Production" during cross-mode drill-down
- AC-6.5: Visual distinction for cross-mode columns (subtle background tone or breadcrumb indicator)
- AC-6.6: Breadcrumb trail shows full path (session → confection → filling → ingredient)
- AC-6.7: Navigate back through cascade closes rightmost columns

**Implementation Notes**:
- Push `{ entityType, entityId, mode: 'view' }` onto cascade stack
- Cross-mode columns are read-only (no editing Library entities from Production context)
- Leverage existing cascade infrastructure from ts-app-shell

---

## Technical Requirements

### TR-1: Component Architecture

**Requirements**:
- TR-1.1: Create `sessions` packlet in `chocolate-lab-ui/src/packlets/`
- TR-1.2: Follow established packlet structure (components, hooks, types)
- TR-1.3: Session list component reuses `useEntityList` hook pattern
- TR-1.4: Session detail uses split column layout component
- TR-1.5: All components use Result pattern for error handling
- TR-1.6: Components subscribe to ReactiveWorkspace for data updates

### TR-2: State Management

**Requirements**:
- TR-2.1: Session list uses Zustand navigation store for filter state
- TR-2.2: Session detail uses local state for produced recipe wrapper
- TR-2.3: Cascade stack managed via Zustand navigation store
- TR-2.4: Toast notifications via ObservabilityContext
- TR-2.5: No local persistence layer (all data via Workspace)

### TR-3: Data Integration

**Requirements**:
- TR-3.1: Access SessionLibrary via ReactiveWorkspace context
- TR-3.2: Access JournalLibrary for group-notes entries
- TR-3.3: Validate session persistence format works with `Produced*` wrappers
- TR-3.4: Handle session status transitions via SessionLibrary methods
- TR-3.5: Create/update group-notes journal entries via JournalLibrary

### TR-4: Code Quality

**Requirements**:
- TR-4.1: No `any` type usage (enforced by linter)
- TR-4.2: Result pattern for all fallible operations
- TR-4.3: Proper TypeScript types for all props and state
- TR-4.4: Converters/Validators for data transformation (no manual type checking)
- TR-4.5: Follow existing code patterns from Library packlets
- TR-4.6: Tailwind CSS for all styling (no inline styles)

### TR-5: Testing

**Requirements**:
- TR-5.1: Focus on functional coverage, not code coverage metrics
- TR-5.2: Test core user flows (create session, transition status, group management)
- TR-5.3: Test error conditions (invalid transitions, missing data)
- TR-5.4: Test edge cases (empty lists, ungrouped sessions, tag disambiguation)
- TR-5.5: Use Result matchers from `@fgv/ts-utils-jest`
- TR-5.6: Code coverage analysis deferred until feature-complete

---

## Data Requirements

### DR-1: Session Entities

**Requirements**:
- DR-1.1: Session entity has fields: id, name, status, group, createdDate, updatedDate, notes
- DR-1.2: Session references source recipe (confection or filling ID + variation spec)
- DR-1.3: Session stores editing history (`ISerializedEditingHistoryEntity`)
- DR-1.4: Session stores procedure progress (checked steps map)
- DR-1.5: Session status enum: `planning`, `active`, `committing`, `committed`, `abandoned`

**Investigation Needed**:
- Verify session persistence format in ts-chocolate
- Confirm `Produced*` wrapper serialization/deserialization works
- Check if procedure progress storage exists or needs to be added

### DR-2: Group-Notes Journal Entries

**Requirements**:
- DR-2.1: Journal entry type `group-notes`
- DR-2.2: Fields: group ID, target dates, notes, metadata
- DR-2.3: Keyed by group identifier (`YYYY-MM-DD-tag`)
- DR-2.4: Created/updated via JournalLibrary

**Investigation Needed**:
- Verify group-notes entry structure in ts-chocolate
- Confirm journal entry creation/update API

---

## Integration Points

### IP-1: Library Mode Integration

**Components to Modify**:
- Confection detail view (add "Start Session" action)
- Filling detail view (add "Start Session" action)

**Integration Requirements**:
- Access ReactiveWorkspace to create session
- Navigate to Production mode via navigation store
- Show toast notification with session link

### IP-2: Navigation Integration

**Requirements**:
- Production mode already defined in navigation store
- Sessions tab already defined
- Cascade types for `session` and `journal-entry` already defined
- Leverage existing cascade infrastructure

### IP-3: Sidebar Integration

**Requirements**:
- Sessions filter config already exists in `filterConfigs.ts`
- Use existing `WorkspaceFilterOptionProvider` for status options
- Reuse sidebar filter components from Library tabs

### IP-4: Workspace Integration

**Requirements**:
- ReactiveWorkspace provides SessionLibrary access
- ReactiveWorkspace emits events on session changes
- Subscribe via `useWorkspace()` hook for re-renders

---

## Exit Criteria

### Functional Exit Criteria

- **FE-1**: User can create a session from a Library confection recipe
- **FE-2**: User can create a session from a Library filling recipe
- **FE-3**: Session creation shows toast with "Go to Session" link that navigates correctly
- **FE-4**: Sessions tab displays all sessions grouped by group or status
- **FE-5**: Empty sessions tab shows appropriate empty state
- **FE-6**: User can filter sessions by status via sidebar
- **FE-7**: User can search sessions by name via sidebar search
- **FE-8**: Clicking a session opens it in cascade with recipe and procedure display
- **FE-9**: User can edit session notes in session detail view
- **FE-10**: User can edit session group field in session detail view
- **FE-11**: User can transition session from planning to active
- **FE-12**: User can transition session from active to committed
- **FE-13**: User can abandon a session from any status
- **FE-14**: Procedure steps are non-interactive during planning status
- **FE-15**: Procedure steps become tickable checkboxes during active status
- **FE-16**: Checked procedure steps persist across sessions
- **FE-17**: User can create/edit group-notes for a session group
- **FE-18**: Group headers show group-notes metadata when available
- **FE-19**: User can drill down from session → confection → filling → ingredient
- **FE-20**: Cross-mode cascade columns have visual distinction
- **FE-21**: Committed sessions are read-only
- **FE-22**: Abandoned sessions are read-only

### Technical Exit Criteria

- **TE-1**: Sessions packlet created following established structure
- **TE-2**: All components follow Result pattern for error handling
- **TE-3**: No `any` type usage anywhere in implementation
- **TE-4**: All data access via ReactiveWorkspace (no direct library access)
- **TE-5**: Navigation via Zustand navigation store (no manual URL manipulation)
- **TE-6**: Cascade integration working for cross-mode drill-down
- **TE-7**: Toast notifications working via ObservabilityContext
- **TE-8**: Session persistence format validated and working
- **TE-9**: Group-notes journal entries created/updated correctly
- **TE-10**: Status transitions validated before execution

### Validation Exit Criteria

- **VE-1**: All functional exit criteria manually tested and working
- **VE-2**: Error conditions tested (invalid transitions, missing data, etc.)
- **VE-3**: Edge cases tested (empty lists, ungrouped sessions, tag reuse)
- **VE-4**: Cross-mode navigation tested for all entity types
- **VE-5**: Session creation from both confections and fillings tested
- **VE-6**: Group-notes creation and editing tested
- **VE-7**: No console errors or warnings during normal operation
- **VE-8**: Performance acceptable (no laggy interactions, renders complete quickly)

### User Acceptance Exit Criteria

- **UA-1**: User can complete full session workflow: create → plan → activate → commit
- **UA-2**: User can organize sessions into groups with metadata
- **UA-3**: User can track production progress via procedure checklist
- **UA-4**: User can explore session details and drill into underlying recipes
- **UA-5**: User can manage multiple sessions simultaneously (via list view)
- **UA-6**: User can find sessions via filtering and search

---

## Risks and Mitigations

### Risk 1: Session Persistence Format Gaps

**Risk**: Session persistence format may not be fully implemented or may have gaps.

**Likelihood**: Medium
**Impact**: High

**Mitigation**:
- Investigate ts-chocolate session model early in design phase
- Flag any gaps or missing functionality immediately
- Implement minimal persistence support if needed
- Document any deferred persistence features

### Risk 2: Cross-Mode Cascade Complexity

**Risk**: Cross-mode cascade navigation may have unexpected edge cases or rendering issues.

**Likelihood**: Medium
**Impact**: Medium

**Mitigation**:
- Follow established cascade patterns from Library mode
- Test cross-mode navigation thoroughly
- Add visual distinction to make cross-mode columns obvious
- Document any cascade limitations discovered

### Risk 3: Group-Notes Integration

**Risk**: Group-notes journal entry integration may be more complex than anticipated.

**Likelihood**: Low
**Impact**: Medium

**Mitigation**:
- Investigate journal entry structure early
- Start with simple group-notes editing (can enhance later)
- Consider modal dialog for editing to keep implementation simple
- Defer rich group-notes features if needed

### Risk 4: Procedure Checklist State

**Risk**: Procedure step progress persistence may not be implemented in session model.

**Likelihood**: Medium
**Impact**: Medium

**Mitigation**:
- Investigate session model for step progress storage
- Add minimal field if missing (e.g., `checkedSteps: Set<string>`)
- Keep checklist simple (just checked/unchecked state)
- Defer advanced features (step notes, partial completion, etc.)

---

## Out of Scope (Deferred)

The following are explicitly OUT OF SCOPE for Phase 5a:

- **Batch Operations**: Group header checkbox for "select all", batch status transitions — deferred to later phase
- **Manual Session Ordering**: Drag-and-drop reordering within groups — deferred to Phase 6 (Polish)
- **Advanced Procedure Features**: Timers, temperature display, "up next" preview — deferred
- **Richer Journal Entries**: Detailed production logs beyond group-notes — deferred to Phase 5b
- **Session Templates**: Pre-configured session templates — future enhancement
- **Session Duplication**: Copy existing session to create new one — future enhancement
- **Commit Flow**: Saving session to Library, capturing yield — deferred to Phase 5b
- **Code Coverage Analysis**: Coverage measurements and gap resolution — deferred until feature-complete

---

## Questions for Design Phase

The following questions should be addressed during the design phase:

1. **Session Persistence**: What is the exact structure of `ISerializedEditingHistoryEntity`? Does it support both confections and fillings? Are there any gaps?

2. **Procedure Progress**: How is procedure step progress stored? Is there an existing field in session entities, or does this need to be added?

3. **Group-Notes Schema**: What is the exact schema for group-notes journal entries? What fields are available? Can we create them via JournalLibrary API?

4. **Status Transition Validation**: What validation rules exist for status transitions? Are there any business rules beyond the basic state machine?

5. **Cross-Mode Cascade**: How should we visually distinguish cross-mode cascade columns? Subtle background tone? Breadcrumb styling? Both?

6. **Session Creation**: Should "Start Session" action be available for all recipe variations, or only specific ones (e.g., golden variation)?

7. **Empty State**: What should the empty state CTA do? Navigate to Library mode? Show a "How to create sessions" guide?

8. **Group Field Validation**: Should group field format be strictly validated (`YYYY-MM-DD-tag`), or can users enter freeform text?

---

## Success Metrics

After Phase 5a is complete, the user should be able to:

1. Create a production session from a Library recipe with 2 clicks
2. See all sessions organized by group or status
3. Open a session and view recipe + procedure
4. Transition a session through planning → active → committed workflow
5. Organize related sessions into a group with shared notes
6. Track production progress via procedure checklist
7. Drill down from session to underlying recipes and ingredients

The Sessions feature should feel like a natural extension of Library mode, with intuitive navigation and clear visual feedback for all operations.

---

**End of Requirements Document**
