# Phase 5a Technical Design: Sessions — Production Mode Core Experience

**Date:** 2026-02-28
**Phase:** 5a (Production Mode — Sessions)
**Status:** Design Complete
**Strategy:** Filling Sessions First, Then Confection Sessions

---

## Executive Summary

This document provides the technical design for Phase 5a, implementing the core production session experience for Chocolate Lab Web. The design follows a filling-sessions-first strategy to validate patterns before extending to confection sessions.

**Key Design Decisions:**
- Session ID format: `YYYY-MM-DD-XX-user-tag` with auto-incremented infix
- Procedure progress tracking via new `procedureProgress` field on session entities
- Group-based organization with optional metadata stored in group-notes journal entries
- Split-layout session detail view (recipe + procedure checklist)
- Status-driven workflow (planning → active → committed/abandoned)

---

## 1. Data Model Changes (ts-chocolate)

### 1.1 Procedure Progress Tracking

**New interface for step-level progress:**

```typescript
// File: libraries/ts-chocolate/src/packlets/entities/session/model.ts

/**
 * Progress tracking for a single procedure step.
 * @public
 */
export interface IStepProgress {
  /** Whether the step has been checked off */
  readonly checked: boolean;
  /** ISO 8601 timestamp when the step was checked (undefined if unchecked) */
  readonly checkedAt?: string;
}

/**
 * Map from step ID to progress state.
 * Only checked steps are stored (sparse representation).
 * @public
 */
export type ProcedureProgressMap = Readonly<Record<string, IStepProgress>>;
```

**Add to ISessionEntityBase:**

```typescript
export interface ISessionEntityBase {
  // ... existing fields ...

  /**
   * Procedure step completion tracking.
   * Maps step ID to progress state. Only checked steps are recorded.
   * Survives procedure changes (orphaned step IDs are ignored during display).
   */
  readonly procedureProgress?: ProcedureProgressMap;
}
```

**Rationale:**
- Sparse storage: Only checked steps recorded, not every step
- Timestamp provides audit trail for production tracking
- Survives procedure changes: If steps are added/removed after session starts, orphaned IDs are simply ignored
- Per-step notes deferred to Phase 5b (not needed for MVP)

**Converter:**

```typescript
// File: libraries/ts-chocolate/src/packlets/entities/session/converters.ts

const stepProgressConverter = Converters.object<IStepProgress>({
  checked: Converters.boolean,
  checkedAt: Converters.optionalField(Converters.isoDateTime)
});

const procedureProgressMapConverter = Converters.recordOf(stepProgressConverter);

// Add to session converters:
const sessionEntityBaseConverter = Converters.object<ISessionEntityBase>({
  baseId: baseSessionIdConverter,
  sessionType: persistedSessionTypeConverter,
  status: persistedSessionStatusConverter,
  createdAt: Converters.isoDateTime,
  updatedAt: Converters.isoDateTime,
  label: Converters.optionalField(Converters.string),
  notes: Converters.optionalField(Converters.arrayOf(categorizedNoteConverter)),
  destination: Converters.optionalField(sessionDestinationConverter),
  group: Converters.optionalField(groupNameConverter),
  procedureProgress: Converters.optionalField(procedureProgressMapConverter)
});
```

### 1.2 Session ID Format

**Current:** `BaseSessionId` format is `YYYY-MM-DD-HHMMSS-randomhex`
**Required:** `YYYY-MM-DD-XX-user-tag` where XX is auto-incremented counter

**New ID Generation Strategy:**

```typescript
// File: libraries/ts-chocolate/src/packlets/user-library/session/sessionUtils.ts

/**
 * Generates a session base ID with user-provided tag and auto-incremented infix.
 * Format: YYYY-MM-DD-XX-tag where XX is a zero-padded counter.
 *
 * @param userTag - Kebab-case user-provided tag (e.g., "birthday-ganache")
 * @param existingSessions - Existing sessions to check for collisions
 * @returns Result with BaseSessionId
 */
export function generateSessionBaseIdWithTag(
  userTag: string,
  existingSessions: ReadonlyArray<{ baseId: BaseSessionId }>
): Result<BaseSessionId> {
  const today = getCurrentDateString(); // YYYY-MM-DD

  // Find existing sessions with the same date and tag
  const pattern = new RegExp(`^${today}-(\\d{2})-${userTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  const existingInfixes = existingSessions
    .map((s) => s.baseId)
    .filter((id) => pattern.test(id))
    .map((id) => {
      const match = pattern.exec(id);
      return match ? parseInt(match[1], 10) : 0;
    });

  const nextInfix = existingInfixes.length > 0 ? Math.max(...existingInfixes) + 1 : 1;
  const infixStr = String(nextInfix).padStart(2, '0');

  return CommonConverters.baseSessionId.convert(`${today}-${infixStr}-${userTag}`);
}
```

**UI Workflow:**
1. User enters session name (e.g., "Birthday Ganache")
2. Derive initial tag from name: `birthday-ganache`
3. Call `generateSessionBaseIdWithTag` to get full ID with infix
4. Display derived ID in modal with infix highlighted: `2026-02-28-`**`01`**`-birthday-ganache`
5. User can edit tag portion (infix auto-updates on blur if tag changes)

**Collision Handling:**
- If user edits tag and it collides with existing session, infix auto-increments
- UI shows "Session with this tag already exists for today — using next available ID"

### 1.3 Group-Notes Journal Entry

**Assumption Validation:** Group-notes journal entry type exists in schema (per requirements A002)

**File to check:** `libraries/ts-chocolate/src/packlets/entities/journal/model.ts`

**Expected structure:**

```typescript
export interface IGroupNotesJournalEntryEntity extends IBaseJournalEntry {
  readonly type: 'group-notes';
  readonly group: GroupName; // Derived from baseId
  readonly targetDate?: string; // ISO date for planned production date
  readonly notes: ReadonlyArray<ICategorizedNote>;
}
```

**If not present, add to journal model and converters.**

---

## 2. Component Architecture (chocolate-lab-ui)

### 2.1 File Structure

**New packlet:** `libraries/chocolate-lab-ui/src/packlets/sessions/`

```
sessions/
├── index.ts                        # Packlet exports
├── SessionListView.tsx             # Grouped session list
├── SessionDetailView.tsx           # Session detail (recipe, metadata, procedure link)
├── SessionCreationModal.tsx        # Modal for creating new session
├── GroupHeader.tsx                 # Group header with notes preview
├── GroupNotesModal.tsx             # Group metadata editor
├── JournalPreviewModal.tsx         # Journal entry preview before commit
├── useSessionActions.ts            # Hook for session CRUD operations
├── useSessionGrouping.ts           # Hook for grouping logic
└── useSessionListState.ts          # Hook for session list state
```

**Modified packlet:** `libraries/chocolate-lab-ui/src/packlets/procedures/`

The existing procedure detail view is enhanced with an optional session progress overlay (checkboxes, timestamps) when opened from a session context. No new files — the existing procedure component gains optional `sessionContext` props.

### 2.2 SessionListView Component

**Purpose:** Main view for Sessions tab, displays grouped sessions with expand/collapse

**Props Interface:**

```typescript
export interface ISessionListViewProps {
  /** All sessions to display */
  readonly sessions: ReadonlyArray<AnySessionEntity>;
  /** Callback when a session is selected */
  readonly onSelectSession: (sessionId: SessionId) => void;
  /** Callback when "Start Session" clicked in Library view */
  readonly onCreateSession?: () => void;
  /** Current filter state (status filter from sidebar) */
  readonly filterState: IFilterState;
}
```

**Component Structure:**

```typescript
export function SessionListView(props: ISessionListViewProps): React.ReactElement {
  const { sessions, onSelectSession, filterState } = props;
  const { groupedSessions, expandedGroups, toggleGroup } = useSessionGrouping(sessions, filterState);

  return (
    <div className="flex flex-col h-full">
      {/* Group headers + session lists */}
      {groupedSessions.map((group) => (
        <div key={group.id}>
          <GroupHeader
            group={group}
            expanded={expandedGroups.has(group.id)}
            onToggle={() => toggleGroup(group.id)}
            onEditNotes={() => {/* open group notes modal */}}
          />
          {expandedGroups.has(group.id) && (
            <div className="divide-y divide-gray-100">
              {group.sessions.map((session) => (
                <SessionListItem
                  key={session.baseId}
                  session={session}
                  onSelect={() => onSelectSession(/* composite ID */)}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Empty state */}
      {sessions.length === 0 && (
        <EmptyState
          title="No production sessions yet"
          description="Create your first session from a Library recipe"
        />
      )}
    </div>
  );
}
```

### 2.3 SessionDetailView Component

**Purpose:** Session detail view — shows recipe, metadata, and a procedure link with progress summary. Procedure checklist is accessed via standard cascade drill-down into the existing procedure detail view (enhanced with session-aware progress overlay).

**REVISED:** No vertical split, no embedded ProcedureChecklist component. The procedure is a cascade drill-down, not an inline section. This is consistent with the cascade paradigm and reuses the existing procedure detail view.

**Props Interface:**

```typescript
export interface ISessionDetailViewProps {
  /** Session entity being viewed */
  readonly session: AnySessionEntity;
  /** Callback to update session (status transitions, metadata) */
  readonly onUpdateSession: (updated: AnySessionEntity) => Promise<void>;
  /** Callback for drill-down navigation (ingredients, procedure, etc.) */
  readonly onDrillDown: (entityType: CascadeEntityType, entityId: string) => void;
  /** Callback to close detail view */
  readonly onClose?: () => void;
}
```

**Component Structure:**

```typescript
export function SessionDetailView(props: ISessionDetailViewProps): React.ReactElement {
  const { session, onUpdateSession, onDrillDown } = props;
  const { workspace } = useWorkspace();

  // Restore editing session from persisted state
  const editingSession = useMemo(() => {
    if (session.sessionType === 'filling') {
      return UserLibrary.Session.EditingSession.fromPersistedState(session);
    }
    return undefined;
  }, [session]);

  // Resolve procedure for progress summary
  const procedureId = editingSession?.produced?.entity?.procedure;
  const procedure = useMemo(() => {
    if (!procedureId) return undefined;
    return workspace.data.procedures.get(procedureId).orDefault(undefined);
  }, [procedureId, workspace]);

  // Compute progress summary
  const progress = session.procedureProgress ?? {};
  const totalSteps = procedure ? procedure.getSteps().orDefault([]).length : 0;
  const completedSteps = Object.values(progress).filter((p) => p.checked).length;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar with status transitions */}
      <SessionToolbar
        session={session}
        onStartProduction={() => {/* transition planning -> active */}}
        onCommit={() => {/* show journal preview modal */}}
        onAbandon={() => {/* confirm and transition to abandoned */}}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Session name + status */}
        <div>
          <h2>{session.label ?? session.baseId}</h2>
          <StatusBadge status={session.status} />
          <div className="text-sm text-gray-500">
            Source: <button onClick={() => onDrillDown('filling', session.sourceVariationId)}>
              {/* source recipe name */}
            </button>
          </div>
        </div>

        {/* Ingredient list (clickable → cascade drill-down) */}
        <SessionRecipeDisplay
          session={session}
          editingSession={editingSession}
          onDrillDown={onDrillDown}
        />

        {/* Procedure link with progress summary */}
        {procedure && (
          <div>
            <button onClick={() => onDrillDown('procedure', procedureId)}>
              Procedure: {procedure.name} →
            </button>
            <div className="text-sm text-gray-500">
              Progress: {completedSteps}/{totalSteps} steps complete
            </div>
            {/* Optional: progress bar visualization */}
          </div>
        )}

        {/* Notes (categorized, editable) */}
        <NotesSection notes={session.notes} editable={session.status !== 'committed'} />

        {/* Session metadata */}
        <SessionMetadata session={session} onUpdateSession={onUpdateSession} />
      </div>
    </div>
  );
}
```

### 2.4 Session-Aware Procedure View (Progress Overlay)

**Purpose:** Enhances the existing procedure detail view with session progress tracking when opened from a session context. NOT a new standalone component — it's the existing procedure view with an additional progress layer.

**Approach:** The cascade entry for a procedure opened from a session carries session context (session ID + progress map). The procedure detail view checks for this context and, if present, renders checkboxes and timestamps alongside each step.

**Cascade Entry:**

```typescript
// When drilling into procedure from session detail:
onDrillDown('procedure', procedureId);
// The cascade entry carries session context via the navigation store:
pushCascade({
  entityType: 'procedure',
  entityId: procedureId,
  mode: 'view',
  sessionContext: {
    sessionId,
    procedureProgress: session.procedureProgress ?? {},
    editable: session.status === 'active',
    onToggleStep: (stepId: string, checked: boolean) => {
      // Update session entity with new progress
    }
  }
});
```

**Existing procedure view enhancement:**

The procedure detail component receives optional `sessionContext` and, when present:
- Renders checkboxes alongside each step
- Shows completion timestamps for checked steps
- Enables/disables checkboxes based on `editable` flag
- Calls `onToggleStep` to persist progress back to the session entity
- Displays progress summary header ("3 of 10 steps complete")

### 2.5 SessionCreationModal Component

**Purpose:** Modal for creating new session with ID derivation and validation

**Props Interface:**

```typescript
export interface ISessionCreationModalProps {
  /** Source recipe name for default session name */
  readonly sourceName: string;
  /** Source variation ID (filling or confection) */
  readonly sourceVariationId: FillingRecipeVariationId | ConfectionRecipeVariationId;
  /** Existing sessions for collision detection */
  readonly existingSessions: ReadonlyArray<AnySessionEntity>;
  /** Callback when session is created */
  readonly onCreate: (params: ICreateSessionParams) => Promise<Result<SessionId>>;
  /** Callback to close modal */
  readonly onClose: () => void;
}

export interface ICreateSessionParams {
  readonly sessionName: string;
  readonly sessionId: BaseSessionId;
  readonly tags: ReadonlyArray<string>;
  readonly group?: GroupName;
  readonly initialStatus: PersistedSessionStatus;
}
```

**Component Logic:**

```typescript
export function SessionCreationModal(props: ISessionCreationModalProps): React.ReactElement {
  const { sourceName, existingSessions, onCreate, onClose } = props;

  // Default session name: "[Recipe Name] - [Date]"
  const defaultName = `${sourceName} - ${getCurrentDateString()}`;
  const [sessionName, setSessionName] = useState(defaultName);
  const [userTag, setUserTag] = useState('');
  const [derivedId, setDerivedId] = useState<BaseSessionId | undefined>(undefined);
  const [tags, setTags] = useState<ReadonlyArray<string>>([]);
  const [group, setGroup] = useState<GroupName | undefined>(undefined);
  const [initialStatus, setInitialStatus] = useState<PersistedSessionStatus>('planning');

  // Auto-derive tag from session name
  useEffect(() => {
    if (!userTag) {
      const derived = sessionName
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setUserTag(derived);
    }
  }, [sessionName, userTag]);

  // Auto-derive ID when tag changes
  useEffect(() => {
    if (userTag) {
      const result = generateSessionBaseIdWithTag(userTag, existingSessions);
      if (result.isSuccess()) {
        setDerivedId(result.value);
      }
    }
  }, [userTag, existingSessions]);

  const handleCreate = async () => {
    if (!derivedId) return;

    const result = await onCreate({
      sessionName,
      sessionId: derivedId,
      tags,
      group,
      initialStatus
    });

    if (result.isSuccess()) {
      onClose();
      // Show toast with "Go to Session" link
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Create Production Session">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session Name</label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-choco-primary focus:border-choco-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Session ID</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{getCurrentDateString()}-</span>
            <span className="text-xs font-mono text-choco-primary">
              {derivedId?.split('-')[3] ?? '01'}
            </span>
            <input
              type="text"
              value={userTag}
              onChange={(e) => setUserTag(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-choco-primary focus:border-choco-primary text-sm font-mono"
              placeholder="session-tag"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Full ID: {derivedId ?? '(invalid)'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (optional)</label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group (optional)</label>
          <GroupSelector
            value={group}
            onChange={setGroup}
            existingGroups={/* derive from existing sessions and group-notes */}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
          <select
            value={initialStatus}
            onChange={(e) => setInitialStatus(e.target.value as PersistedSessionStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-choco-primary focus:border-choco-primary"
          >
            <option value="planning">Planning</option>
            <option value="active">Active</option>
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!derivedId}
            className="px-4 py-2 bg-choco-primary text-white rounded hover:bg-choco-primary/90 disabled:opacity-50"
          >
            Create Session
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 2.6 GroupNotesModal Component

**Purpose:** Edit group metadata (target date, categorized notes)

**Props Interface:**

```typescript
export interface IGroupNotesModalProps {
  /** Group name */
  readonly group: GroupName;
  /** Existing group notes entry (if any) */
  readonly existingNotes?: IGroupNotesJournalEntryEntity;
  /** Callback to save group notes */
  readonly onSave: (notes: IGroupNotesJournalEntryEntity) => Promise<Result<void>>;
  /** Callback to close modal */
  readonly onClose: () => void;
}
```

**Component:**

```typescript
export function GroupNotesModal(props: IGroupNotesModalProps): React.ReactElement {
  const { group, existingNotes, onSave, onClose } = props;

  const [targetDate, setTargetDate] = useState(existingNotes?.targetDate ?? '');
  const [notes, setNotes] = useState<ReadonlyArray<ICategorizedNote>>(existingNotes?.notes ?? []);

  const handleSave = async () => {
    const entry: IGroupNotesJournalEntryEntity = {
      type: 'group-notes',
      baseId: group as unknown as BaseJournalId, // Group name serves as baseId
      timestamp: getCurrentTimestamp(),
      group,
      targetDate: targetDate || undefined,
      notes
    };

    const result = await onSave(entry);
    if (result.isSuccess()) {
      onClose();
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title={`Group Notes: ${group}`}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-choco-primary focus:border-choco-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <NotesEditor notes={notes} onChange={setNotes} />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-choco-primary text-white rounded hover:bg-choco-primary/90"
          >
            Save Group Notes
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

### 2.7 JournalPreviewModal Component

**Purpose:** Preview journal entry before committing session

**Props Interface:**

```typescript
export interface IJournalPreviewModalProps {
  /** Constructed journal entry to preview */
  readonly journalEntry: IFillingProductionJournalEntryEntity | IConfectionProductionJournalEntryEntity;
  /** Callback to confirm commit */
  readonly onConfirm: () => Promise<Result<void>>;
  /** Callback to cancel */
  readonly onCancel: () => void;
}
```

**Component:**

```typescript
export function JournalPreviewModal(props: IJournalPreviewModalProps): React.ReactElement {
  const { journalEntry, onConfirm, onCancel } = props;

  return (
    <Modal isOpen={true} onClose={onCancel} title="Journal Entry Preview" size="large">
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Entry Details</h3>
          <div className="space-y-1 text-sm">
            <div><strong>Type:</strong> {journalEntry.type}</div>
            <div><strong>Timestamp:</strong> {new Date(journalEntry.timestamp).toLocaleString()}</div>
            <div><strong>Source:</strong> {journalEntry.sourceVariationId}</div>
          </div>
        </div>

        {/* Display produced recipe snapshot */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Produced Recipe</h3>
          <ProducedRecipeDisplay entity={journalEntry.produced} />
        </div>

        {/* Display procedure progress */}
        {journalEntry.procedureProgress && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Steps Completed</h3>
            <ProcedureProgressSummary progress={journalEntry.procedureProgress} />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
            Cancel
          </button>
          <button
            onClick={async () => {
              const result = await onConfirm();
              if (result.isSuccess()) {
                // Modal closes via parent state update
              }
            }}
            className="px-4 py-2 bg-choco-primary text-white rounded hover:bg-choco-primary/90"
          >
            Commit Session
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

---

## 3. Hooks & State Management

### 3.1 useSessionActions Hook

**Purpose:** Encapsulates session CRUD operations with ReactiveWorkspace integration

**Interface:**

```typescript
export interface ISessionActions {
  /** Create a new session from a Library recipe */
  createSession: (params: ICreateSessionParams) => Promise<Result<SessionId>>;
  /** Update an existing session */
  updateSession: (session: AnySessionEntity) => Promise<Result<void>>;
  /** Delete a session */
  deleteSession: (sessionId: SessionId) => Promise<Result<void>>;
  /** Transition session status */
  transitionStatus: (sessionId: SessionId, newStatus: PersistedSessionStatus) => Promise<Result<void>>;
  /** Update procedure progress for a session */
  updateProcedureProgress: (sessionId: SessionId, progress: ProcedureProgressMap) => Promise<Result<void>>;
  /** Construct journal entry from session (does not persist) */
  buildJournalEntry: (sessionId: SessionId) => Result<IFillingProductionJournalEntryEntity | IConfectionProductionJournalEntryEntity>;
}

export function useSessionActions(): ISessionActions {
  const { workspace, reactiveWorkspace } = useWorkspace();

  const createSession = useCallback(async (params: ICreateSessionParams): Promise<Result<SessionId>> => {
    // 1. Get default session collection ID from settings
    const defaultCollectionId = workspace.settings?.getResolvedSettings().defaultTargets.sessions;
    if (!defaultCollectionId) {
      return fail('No default session collection configured');
    }

    // 2. Build session entity from params
    const sessionEntity: IFillingSessionEntity = {
      baseId: params.sessionId,
      sessionType: 'filling',
      status: params.initialStatus,
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
      label: params.sessionName,
      group: params.group,
      sourceVariationId: params.sourceVariationId,
      history: /* build from EditingSession */,
      procedureProgress: {}
    };

    // 3. Persist to collection
    const collectionResult = workspace.data.entities.sessions.collections.get(defaultCollectionId);
    if (collectionResult.isFailure() || !collectionResult.value.isMutable) {
      return fail('Default session collection not available for writing');
    }

    const setResult = collectionResult.value.items.set(params.sessionId, sessionEntity);
    if (setResult.isFailure()) {
      return fail(`Failed to add session: ${setResult.message}`);
    }

    // 4. Persist to disk if collection is backed by storage
    const editableResult = workspace.data.entities.getEditableSessionEntityCollection(
      defaultCollectionId,
      workspace.keyStore
    );
    if (editableResult.isSuccess()) {
      const editable = editableResult.value;
      editable.set(params.sessionId, sessionEntity);
      if (editable.canSave()) {
        const diskResult = await editable.save();
        if (diskResult.isFailure()) {
          workspace.data.logger.error(`Failed to save session to disk: ${diskResult.message}`);
        }
      }
    }

    // 5. Notify workspace
    workspace.data.clearCache();
    reactiveWorkspace.notifyChange();

    return succeed(`${defaultCollectionId}.${params.sessionId}` as SessionId);
  }, [workspace, reactiveWorkspace]);

  // ... similar implementations for updateSession, deleteSession, etc.

  return {
    createSession,
    updateSession,
    deleteSession,
    transitionStatus,
    updateProcedureProgress,
    buildJournalEntry
  };
}
```

### 3.2 useSessionGrouping Hook

**Purpose:** Groups sessions by `group ?? status` with expand/collapse state

**Interface:**

```typescript
export interface ISessionGroup {
  readonly id: string; // Group name or status
  readonly label: string; // Display label
  readonly sessions: ReadonlyArray<AnySessionEntity>;
  readonly groupNotes?: IGroupNotesJournalEntryEntity;
}

export interface ISessionGroupingResult {
  readonly groupedSessions: ReadonlyArray<ISessionGroup>;
  readonly expandedGroups: ReadonlySet<string>;
  readonly toggleGroup: (groupId: string) => void;
}

export function useSessionGrouping(
  sessions: ReadonlyArray<AnySessionEntity>,
  filterState: IFilterState
): ISessionGroupingResult {
  // 1. Apply status filter if active
  const filteredSessions = useMemo(() => {
    const statusFilter = filterState.selections['status']?.[0];
    if (!statusFilter) return sessions;
    return sessions.filter((s) => s.status === statusFilter);
  }, [sessions, filterState]);

  // 2. Group by group ?? status
  const groups = useMemo<ReadonlyArray<ISessionGroup>>(() => {
    const groupMap = new Map<string, AnySessionEntity[]>();

    for (const session of filteredSessions) {
      const key = session.group ?? session.status;
      if (!groupMap.has(key)) {
        groupMap.set(key, []);
      }
      groupMap.get(key)!.push(session);
    }

    return Array.from(groupMap.entries()).map(([key, sessions]) => ({
      id: key,
      label: sessions[0].group ? `Group: ${key}` : STATUS_LABELS[key as PersistedSessionStatus],
      sessions,
      groupNotes: /* fetch from workspace.data.journals if group */
    }));
  }, [filteredSessions]);

  // 3. Expand/collapse state (persist in navigation store)
  const [expandedGroups, setExpandedGroups] = useState<ReadonlySet<string>>(() => {
    // Default: expand all groups
    return new Set(groups.map((g) => g.id));
  });

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  return { groupedSessions: groups, expandedGroups, toggleGroup };
}
```

---

## 4. Integration Points

### 4.1 "Start Session" Button in Library Views

**Files to modify:**
- `libraries/chocolate-lab-ui/src/packlets/fillings/FillingDetail.tsx`
- `libraries/chocolate-lab-ui/src/packlets/confections/ConfectionDetail.tsx`

**Changes:**

```typescript
// In FillingDetail.tsx (lines ~350-360, actions section)

export interface IFillingDetailProps {
  // ... existing props ...
  /** Optional callback to create a session from this filling */
  readonly onStartSession?: (variationSpec: FillingRecipeVariationSpec) => void;
}

// In actions section:
{onStartSession && (
  <button
    type="button"
    onClick={() => onStartSession(selectedSpec)}
    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
    title="Start production session"
  >
    <PlayIcon className="w-4 h-4" />
    Start Session
  </button>
)}
```

**In FillingsTab.tsx:**

```typescript
const handleStartSession = useCallback((fillingId: FillingId, variationSpec: FillingRecipeVariationSpec) => {
  const filling = workspace.data.fillings.get(fillingId);
  if (filling.isFailure()) return;

  const variation = filling.value.getVariation(variationSpec);
  if (variation.isFailure()) return;

  // Open session creation modal
  setSessionCreationParams({
    sourceName: filling.value.name,
    sourceVariationId: Helpers.createFillingRecipeVariationId(fillingId, variationSpec)
  });
}, [workspace]);

// Pass to FillingDetail:
<FillingDetail
  filling={result.value}
  onStartSession={(spec) => handleStartSession(entry.entityId as FillingId, spec)}
  // ... other props
/>
```

### 4.2 Toast with "Go to Session" Navigation

**After session creation:**

```typescript
const handleCreateSession = async (params: ICreateSessionParams): Promise<Result<SessionId>> => {
  const result = await sessionActions.createSession(params);

  if (result.isSuccess()) {
    const sessionId = result.value;

    // Show toast with navigation link
    workspace.data.logger.info(
      `Session created: ${params.sessionName}`,
      {
        action: {
          label: 'Go to Session',
          handler: () => {
            // 1. Switch to Production mode
            useNavigationStore.getState().setMode('production');
            // 2. Switch to Sessions tab
            useNavigationStore.getState().setTab('sessions');
            // 3. Push session to cascade
            useNavigationStore.getState().pushCascade({
              entityType: 'session',
              entityId: sessionId,
              mode: 'view'
            });
          }
        }
      }
    );
  }

  return result;
};
```

**Note:** This requires extending the toast notification system in `ts-app-shell` to support action buttons. If not available, defer to Phase 5b.

### 4.3 Cross-Mode Cascade Drill-Down

**Session → Ingredient drill-down with mode context:**

When a user clicks an ingredient from a session detail view, the cascade should:
1. Open ingredient detail in next column
2. Maintain Production mode context (visual differentiation)
3. Allow full cascade navigation (ingredient → filling → confection)

**Implementation in SessionDetailView:**

```typescript
const handleIngredientClick = useCallback((ingredientId: IngredientId) => {
  // Push ingredient to cascade with cross-mode context
  useNavigationStore.getState().pushCascade({
    entityType: 'ingredient',
    entityId: ingredientId,
    mode: 'view'
    // NOTE: No mode field needed — cascade entries inherit from tab
  });
}, []);
```

**Visual differentiation:** Add background tone to cross-mode cascade columns

```typescript
// In EntityTabLayout (ts-app-shell):
const isCrossMode = mode === 'production' && entry.entityType !== 'session';

<div className={`cascade-column ${isCrossMode ? 'bg-blue-50' : ''}`}>
  {/* column content */}
</div>
```

---

## 5. SessionsTab Implementation

**File:** `apps/chocolate-lab-web/src/tabs/SessionsTab.tsx`

**Structure (following FillingsTab pattern):**

```typescript
export function SessionsTabContent(): React.ReactElement {
  const {
    workspace,
    reactiveWorkspace,
    squashCascade,
    popCascadeTo,
    cascadeStack,
    listCollapsed,
    collapseList
  } = useTabNavigation();

  const sessionActions = useSessionActions();
  const [sessionCreationParams, setSessionCreationParams] = useState<ISessionCreationParams | undefined>(undefined);
  const [journalPreview, setJournalPreview] = useState<IJournalPreviewParams | undefined>(undefined);
  const [groupNotesTarget, setGroupNotesTarget] = useState<GroupName | undefined>(undefined);

  // Get all sessions
  const { entities: sessions, selectedId } = useEntityList<AnySessionEntity, SessionId>({
    getAll: () => workspace.data.sessions.values(),
    compare: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(), // Newest first
    entityType: 'session',
    cascadeStack,
    deps: [workspace, reactiveWorkspace.version]
  });

  const handleSelectSession = useCallback((id: SessionId) => {
    const entry: ICascadeEntry = { entityType: 'session', entityId: id, mode: 'view' };
    squashCascade([entry]);
  }, [squashCascade]);

  const handleStartProduction = useCallback(async (sessionId: SessionId) => {
    await sessionActions.transitionStatus(sessionId, 'active');
    workspace.data.logger.info('Session started');
  }, [sessionActions, workspace]);

  const handleCommitSession = useCallback(async (sessionId: SessionId) => {
    const journalEntryResult = sessionActions.buildJournalEntry(sessionId);
    if (journalEntryResult.isFailure()) {
      workspace.data.logger.error(`Failed to build journal entry: ${journalEntryResult.message}`);
      return;
    }

    // Show preview modal
    setJournalPreview({ sessionId, journalEntry: journalEntryResult.value });
  }, [sessionActions, workspace]);

  const handleConfirmCommit = useCallback(async (sessionId: SessionId) => {
    await sessionActions.transitionStatus(sessionId, 'committed');
    setJournalPreview(undefined);
    workspace.data.logger.info('Session committed');
  }, [sessionActions, workspace]);

  const handleAbandonSession = useCallback(async (sessionId: SessionId) => {
    // Show confirmation dialog, then:
    await sessionActions.transitionStatus(sessionId, 'abandoned');
    workspace.data.logger.info('Session abandoned');
  }, [sessionActions, workspace]);

  // Cascade columns
  const cascadeColumns = useMemo<ReadonlyArray<ICascadeColumn>>(() => {
    return cascadeStack.map((entry) => {
      if (entry.entityType === 'session') {
        const result = workspace.data.sessions.get(entry.entityId as SessionId);
        if (result.isFailure()) {
          return {
            key: entry.entityId,
            label: entry.entityId,
            content: <div className="p-4 text-red-500">Failed to load session</div>
          };
        }

        return {
          key: entry.entityId,
          label: result.value.label ?? result.value.baseId,
          content: (
            <SessionDetailView
              session={result.value}
              onUpdateSession={sessionActions.updateSession}
              onDrillDown={(entityType, entityId) => {
                useNavigationStore.getState().pushCascade({
                  entityType,
                  entityId,
                  mode: 'view'
                });
              }}
            />
          )
        };
      }

      // Handle cross-mode drill-downs (ingredient, filling, etc.)
      // ... delegate to ingredient/filling detail views

      return {
        key: entry.entityId,
        label: entry.entityId,
        content: <div className="p-4">Unknown entity type</div>
      };
    });
  }, [cascadeStack, workspace, sessionActions]);

  return (
    <>
      {sessionCreationParams && (
        <SessionCreationModal
          {...sessionCreationParams}
          onCreate={sessionActions.createSession}
          onClose={() => setSessionCreationParams(undefined)}
        />
      )}

      {journalPreview && (
        <JournalPreviewModal
          journalEntry={journalPreview.journalEntry}
          onConfirm={() => handleConfirmCommit(journalPreview.sessionId)}
          onCancel={() => setJournalPreview(undefined)}
        />
      )}

      {groupNotesTarget && (
        <GroupNotesModal
          group={groupNotesTarget}
          onSave={/* save to journal collection */}
          onClose={() => setGroupNotesTarget(undefined)}
        />
      )}

      <EntityTabLayout
        list={
          <SessionListView
            sessions={sessions}
            onSelectSession={handleSelectSession}
            filterState={/* from navigation store */}
          />
        }
        cascadeColumns={cascadeColumns}
        onPopTo={popCascadeTo}
        listCollapsed={listCollapsed}
        onListCollapse={collapseList}
      />
    </>
  );
}
```

**Register in App.tsx:**

```typescript
// File: apps/chocolate-lab-web/src/App.tsx

import { SessionsTabContent } from './tabs/SessionsTab';

function TabContent({ tab }: { readonly tab: AppTab }): React.ReactElement {
  switch (tab) {
    case 'sessions':
      return <SessionsTabContent />;
    case 'ingredients':
      return <IngredientsTabContent />;
    // ... other tabs
  }
}
```

---

## 6. State Persistence & Restoration

### 6.1 Session Serialization

**EditingSession already supports serialization via:**

```typescript
// In EditingSession class:
public toPersistedEntity(): IFillingSessionEntity {
  return {
    baseId: this._sessionId.baseId,
    sessionType: 'filling',
    status: this._status,
    createdAt: this._createdAt,
    updatedAt: getCurrentTimestamp(),
    label: this._label,
    group: this._group,
    sourceVariationId: this._baseRecipe.variationId,
    history: this._produced.serializeHistory(),
    procedureProgress: this._procedureProgress
  };
}
```

### 6.2 Session Restoration

**EditingSession.fromPersistedState():**

```typescript
public static fromPersistedState(entity: IFillingSessionEntity): Result<EditingSession> {
  // 1. Restore ProducedFilling from history
  const producedResult = ProducedFilling.fromSerializedHistory(entity.history);
  if (producedResult.isFailure()) {
    return fail(`Failed to restore editing state: ${producedResult.message}`);
  }

  // 2. Reconstruct EditingSession
  return captureResult(() => new EditingSession(
    /* base recipe */, // Need to resolve from sourceVariationId
    producedResult.value,
    entity.baseId,
    entity.history.original
  ));
}
```

**Issue:** Restoration needs access to workspace to resolve sourceVariationId → IFillingRecipeVariation

**Solution:** Restoration happens in UI layer, not in EditingSession class

```typescript
// In SessionDetailView:
const editingSession = useMemo(() => {
  if (session.sessionType !== 'filling') return undefined;

  // 1. Resolve source variation from workspace
  const variationResult = workspace.data.fillings.getVariation(session.sourceVariationId);
  if (variationResult.isFailure()) {
    workspace.data.logger.error(`Failed to resolve source variation: ${variationResult.message}`);
    return undefined;
  }

  // 2. Create EditingSession from base recipe + persisted history
  const sessionResult = UserLibrary.Session.EditingSession.fromPersistedState(
    variationResult.value,
    session.history
  );
  if (sessionResult.isFailure()) {
    workspace.data.logger.error(`Failed to restore editing session: ${sessionResult.message}`);
    return undefined;
  }

  return sessionResult.value;
}, [session, workspace]);
```

---

## 7. Open Questions & Risks

### 7.1 Data Model Questions

**Q1:** Does `EditingSession.fromPersistedState()` exist in ts-chocolate?
**Answer:** Review `libraries/ts-chocolate/src/packlets/user-library/session/editingSession.ts` during implementation. If not, add static method.

**Q2:** Does group-notes journal entry type exist?
**Answer:** Check `libraries/ts-chocolate/src/packlets/entities/journal/model.ts`. If missing, add during implementation.

**Q3:** How are session collections managed (default target)?
**Answer:** Follow ingredient/filling collection pattern. Add `sessions` key to `IDefaultTargets` in settings schema.

### 7.2 UX Questions

**Q4:** Should checked steps be strikethrough, grayed out, or remain highlighted?
**Recommendation:** Strikethrough + gray for completed steps (conventional checklist pattern)

**Q5:** Should journal preview be editable or strictly read-only?
**Recommendation:** Read-only for Phase 5a. Editable journal construction is a Phase 5b enhancement.

**Q6:** What happens if user-edited session ID collides with existing session?
**Recommendation:** Auto-increment infix and show toast: "Session with this tag exists — using next available ID"

### 7.3 Technical Risks

**R1:** Session restoration complexity
**Mitigation:** Comprehensive automated tests for serialization/deserialization round-trip
**Fallback:** If restoration fails, show error + "Start new session from recipe" option

**R2:** Procedure progress handling when procedure changes
**Mitigation:** Sparse storage (only checked steps) + orphan detection (ignore missing step IDs)
**Fallback:** Show warning "Procedure has changed — some completed steps may not display"

**R3:** Cross-mode cascade navigation state management
**Mitigation:** Reuse existing cascade infrastructure, add mode-aware visual styling
**Fallback:** If cross-mode cascade proves complex, defer to Phase 5b and use read-only preview within Production mode

---

## 8. Implementation Order

### Phase 5a Iteration 1: Filling Sessions (Week 1-2)

#### Step 1: Data Model (Day 1)
1. Add `procedureProgress` field to `ISessionEntityBase`
2. Create `IStepProgress` interface and converter
3. Add `generateSessionBaseIdWithTag()` utility
4. Validate group-notes journal entry type exists (or add)

#### Step 2: Core Session Actions (Day 2-3)
1. Implement `useSessionActions` hook
2. Create session CRUD operations (create, update, delete)
3. Add status transition logic
4. Test with manual session creation

#### Step 3: Session List View (Day 4-5)
1. Implement `SessionListView` component
2. Implement `useSessionGrouping` hook
3. Create `GroupHeader` component
4. Add expand/collapse state management
5. Wire up to SessionsTab

#### Step 4: Session Detail View (Day 6-8)
1. Implement `SessionDetailView` component
2. Create `SessionRecipeDisplay` sub-component
3. Implement `ProcedureChecklist` component
4. Add procedure progress persistence
5. Test checklist interaction (check/uncheck, timestamps)

#### Step 5: Session Creation Flow (Day 9-10)
1. Implement `SessionCreationModal` component
2. Add ID derivation logic with infix auto-increment
3. Wire "Start Session" button to FillingDetail
4. Test creation from Library view
5. Verify toast notification with navigation

#### Step 6: Status Transitions (Day 11-12)
1. Add status transition toolbar to SessionDetailView
2. Implement planning → active transition
3. Add journal entry construction logic
4. Implement `JournalPreviewModal`
5. Add commit workflow (preview → confirm → committed)
6. Add abandon workflow with confirmation

#### Step 7: Group Management (Day 13-14)
1. Implement `GroupNotesModal` component
2. Add group assignment UI in SessionDetailView
3. Test group-notes persistence to journal collection
4. Verify grouping in SessionListView

### Phase 5a Iteration 2: Confection Sessions (Week 3)

#### Step 8: Confection Session Data Model
1. Review `IConfectionSessionEntity` schema
2. Add child filling session management
3. Test confection session serialization

#### Step 9: Confection Session UI
1. Adapt SessionDetailView for confection sessions
2. Add mold/chocolate display
3. Add child filling slot drill-down
4. Test confection session creation from Library

#### Step 10: Confection-Specific Editing
1. Add mold change workflow
2. Add yield adjustment
3. Test child filling session restoration
4. Verify confection journal entry construction

### Phase 5a Iteration 3: Polish & Integration (Week 4)

#### Step 11: Cross-Mode Cascade
1. Add cross-mode drill-down from session detail
2. Implement visual differentiation (background tone)
3. Test ingredient → filling → confection navigation
4. Verify breadcrumb display

#### Step 12: Status Filter
1. Add status filter to sidebar (already defined in filterConfigs.ts)
2. Wire filter to useSessionGrouping hook
3. Test filter application (hide/show groups)

#### Step 13: Testing & Validation
1. Run automated tests for all session operations
2. Perform manual walkthrough of filling session lifecycle
3. Perform manual walkthrough of confection session lifecycle
4. Test session restoration (close/reopen with state preserved)
5. Validate exit criteria EC001-EC014

#### Step 14: User Acceptance
1. Demo to user: filling session workflow
2. Demo to user: confection session workflow
3. Gather feedback and address critical issues
4. Document known limitations for Phase 5b

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Data Model:**
- Session entity serialization/deserialization round-trip
- Procedure progress schema validation (edge cases: missing steps, extra steps)
- Session ID generation with collision handling
- Group name validation

**Business Logic:**
- Status transition validation (valid/invalid transitions)
- Journal entry construction from session state
- Procedure progress update logic

### 9.2 Integration Tests

**Session Lifecycle:**
- Create session from Library filling → verify persistence
- Update session (status, progress) → verify ReactiveWorkspace notification
- Delete session → verify cascade cleanup
- Restore session from persisted state → verify identical editing state

**Group Management:**
- Create group-notes entry → verify journal persistence
- Assign session to group → verify grouping in list view
- Edit group notes → verify update persistence

### 9.3 Component Tests

**SessionListView:**
- Grouping logic (group precedence over status)
- Filtering (status filter hides groups)
- Expand/collapse state persistence

**ProcedureChecklist:**
- Check/uncheck interaction (only when editable)
- Progress persistence (verify timestamps)
- Disabled state (planning, committed, abandoned)

**SessionCreationModal:**
- Name → tag derivation (kebab-case conversion)
- ID auto-increment on collision
- Validation (empty name, invalid group format)

### 9.4 End-to-End Functional Tests (Manual)

**Filling Session Workflow:**
1. Navigate to Library → Fillings
2. Select filling, click "Start Session"
3. Enter session name, verify ID derivation
4. Create session → verify toast with "Go to Session"
5. Click "Go to Session" → verify Production mode + Sessions tab + cascade
6. Click "Start Production" → verify status → active
7. Check off procedure steps → verify timestamps persist
8. Click "Commit Session" → verify journal preview modal
9. Confirm commit → verify status → committed
10. Close and reopen session → verify procedure progress restored

**Confection Session Workflow:**
1. Navigate to Library → Confections
2. Select confection, click "Start Session"
3. Create session → navigate to detail
4. Edit mold → verify yield recalculation
5. Drill into filling slot → verify child session link
6. Complete procedure → commit → verify journal includes child fillings

**Group Management Workflow:**
1. Create session with group assignment
2. Create second session with same group
3. Verify both sessions appear under group header
4. Click group header → open group notes modal
5. Add target date + categorized notes → save
6. Verify group header shows notes preview

---

## 10. Dependencies & Prerequisites

### 10.1 Upstream Dependencies (Must Exist)

- [x] ReactiveWorkspace with change notification
- [x] SessionLibrary with query methods (already exists)
- [x] Navigation store with cascade support (already exists)
- [x] Sidebar filter infrastructure (already exists)
- [x] Toast and logging via ObservabilityContext (already exists)
- [x] EditingSession classes for fillings (exist)
- [ ] **Validate:** Confection editing session classes (need validation)
- [ ] **Validate:** Group-notes journal entry type (need validation)

### 10.2 New Infrastructure Needed

- [ ] Session ID generation with tag-based format
- [ ] Procedure progress tracking schema
- [ ] Session CRUD operations with ReactiveWorkspace integration
- [ ] Session restoration from persisted state
- [ ] Journal entry construction (no persistence in Phase 5a)

### 10.3 Downstream Phases Blocked

- Phase 5b: Journal persistence (needs journal entry construction from Phase 5a)
- Phase 5b: Inventory updates on commit (needs commit workflow from Phase 5a)
- Phase 5c: Related Activity panel (needs session → recipe linking from Phase 5a)

---

## 11. Success Metrics

Phase 5a is successful when:

1. **Filling session lifecycle complete:** User can create → plan → execute → commit filling session with procedure checklist
2. **Confection session lifecycle complete:** User can create → execute confection session with child filling sessions
3. **Group management working:** Sessions grouped correctly, group notes editable and displayed
4. **Procedure progress tracking:** Steps can be checked off during active status, progress persists
5. **Status transitions validated:** All valid transitions work, invalid transitions blocked
6. **Session restoration working:** Sessions restore with identical state (editing history, procedure progress)
7. **Cross-mode cascade working:** Can drill from session → ingredient/filling/mold with visual differentiation
8. **User acceptance:** User confirms feature meets production workflow needs
9. **Zero critical bugs:** No data loss, no state corruption, no blocking UX issues
10. **Data model gaps documented:** Known limitations recorded for Phase 5b

---

## 12. Files Summary

### New Files

**ts-chocolate (data model):**
- `libraries/ts-chocolate/src/packlets/entities/session/procedureProgress.ts` (if needed for separate concerns)

**chocolate-lab-ui (UI components):**
- `libraries/chocolate-lab-ui/src/packlets/sessions/index.ts`
- `libraries/chocolate-lab-ui/src/packlets/sessions/SessionListView.tsx`
- `libraries/chocolate-lab-ui/src/packlets/sessions/SessionDetailView.tsx`
- `libraries/chocolate-lab-ui/src/packlets/sessions/SessionCreationModal.tsx`
- `libraries/chocolate-lab-ui/src/packlets/sessions/GroupHeader.tsx`
- `libraries/chocolate-lab-ui/src/packlets/sessions/GroupNotesModal.tsx`
- `libraries/chocolate-lab-ui/src/packlets/sessions/JournalPreviewModal.tsx`
- `libraries/chocolate-lab-ui/src/packlets/sessions/useSessionActions.ts`
- `libraries/chocolate-lab-ui/src/packlets/sessions/useSessionGrouping.ts`
- `libraries/chocolate-lab-ui/src/packlets/sessions/useSessionListState.ts`

**chocolate-lab-web (tab implementation):**
- `apps/chocolate-lab-web/src/tabs/SessionsTab.tsx`

### Modified Files

**ts-chocolate:**
- `libraries/ts-chocolate/src/packlets/entities/session/model.ts` (add procedureProgress field)
- `libraries/ts-chocolate/src/packlets/entities/session/converters.ts` (add progress converter)
- `libraries/ts-chocolate/src/packlets/user-library/session/sessionUtils.ts` (add tag-based ID generation)
- `libraries/ts-chocolate/src/packlets/user-library/session/editingSession.ts` (add fromPersistedState if missing)

**chocolate-lab-ui:**
- `libraries/chocolate-lab-ui/src/packlets/fillings/FillingDetail.tsx` (add onStartSession prop)
- `libraries/chocolate-lab-ui/src/packlets/confections/ConfectionDetail.tsx` (add onStartSession prop)
- `libraries/chocolate-lab-ui/src/packlets/procedures/ProcedureDetail.tsx` (add optional sessionContext for progress overlay)

**chocolate-lab-web:**
- `apps/chocolate-lab-web/src/App.tsx` (register SessionsTab)
- `apps/chocolate-lab-web/src/tabs/FillingsTab.tsx` (wire Start Session button)
- `apps/chocolate-lab-web/src/tabs/ConfectionsTab.tsx` (wire Start Session button)

**Navigation model:**
- `libraries/chocolate-lab-ui/src/packlets/navigation/model.ts` (session already in CascadeEntityType)

---

## 13. Design Decisions & Rationale

### D1: Session ID Format — Tag-Based with Infix

**Decision:** Use `YYYY-MM-DD-XX-user-tag` format instead of timestamp-based
**Rationale:**
- More human-readable than random hex
- Supports grouping sessions by date
- Infix allows multiple sessions with same tag on same day
- User can customize tag for meaningful naming

**Alternative Considered:** Keep timestamp-based (`YYYY-MM-DD-HHMMSS-random`)
**Rejected Because:** Less readable, harder to reference in kitchen environment

### D2: Procedure Progress — Sparse Storage

**Decision:** Store only checked steps in `procedureProgress` map
**Rationale:**
- Reduces entity size (no need to store every step's unchecked state)
- Survives procedure changes (orphaned step IDs simply ignored)
- Timestamp provides audit trail for production tracking

**Alternative Considered:** Store all steps with boolean flags
**Rejected Because:** Redundant data, doesn't handle procedure changes gracefully

### D3: Filling Sessions First Strategy

**Decision:** Build filling sessions completely before confection sessions
**Rationale:**
- Fillings are simpler (no child sessions, no mold/chocolate complexity)
- Validates patterns (state tracking, persistence, UI) before extending to confections
- Reduces risk of rework if confection sessions reveal new requirements

**Alternative Considered:** Implement both in parallel
**Rejected Because:** Higher risk, harder to validate patterns

### D4: Group-Based Organization vs. Manual Ordering

**Decision:** Groups based on `group ?? status`, no manual drag-to-reorder
**Rationale:**
- Automatic grouping reduces user friction
- Status-based fallback ensures all sessions are visible
- Manual ordering is nice-to-have P1 (deferred)

**Alternative Considered:** Flat list with manual drag-to-reorder
**Rejected Because:** Doesn't scale to large session counts, requires complex state management

### D5: Journal Entry Preview Only (No Persistence)

**Decision:** Construct and preview journal entry, but don't persist in Phase 5a
**Rationale:**
- Journal persistence infrastructure is Phase 5b scope
- Preview validates journal construction logic
- User can verify data before commit (smoke test)

**Alternative Considered:** Persist journal entries immediately
**Rejected Because:** Requires JournalLibrary CRUD, journal tab UI (out of scope)

### D6: Cascade Drill-Down for Procedure (REVISED)

**Decision:** Session detail in one cascade column; procedure accessed via standard cascade drill-down into existing procedure detail view (enhanced with session-aware progress overlay)
**Rationale:**
- Consistent with cascade paradigm used everywhere else in the app
- Reuses existing procedure detail view (procedures are already entities)
- Landscape tablet orientation gives adequate width to each column
- No new interaction paradigms (overlays, slide-outs, vertical splits)

**Alternative Rejected: Vertical split (recipe above, checklist below)**
**Rejected Because:** In landscape tablet orientation (expected kitchen use), produces two tiny unreadable rows. Also fights the horizontal cascade paradigm.

**Alternative Rejected: Slide-out/overlay panel**
**Rejected Because:** Introduces a new interaction paradigm that exists nowhere else in the app. Functionally equivalent to a cascade column but with extra complexity.

---

**End of Design Document**
