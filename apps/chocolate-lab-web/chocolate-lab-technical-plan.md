# Chocolate Lab Web — Technical Plan

This document captures technical architecture decisions and implementation phasing for the Chocolate Lab Web application. It complements the [UX Design Decisions](./chocolate-lab-ux-plan.md) and the original [Plan](./chocolate-lab-plan.md).

---

## 1. Package Architecture

### New Packages

| Package | Location | Purpose |
|---------|----------|---------|
| `@fgv/ts-app-shell` | `libraries/ts-app-shell` | Shared UI primitives: column cascade, compact sidebar with flyout, toast/log messages, command palette, keybinding registry. Reusable across apps. |
| `@fgv/chocolate-lab-ui` | `libraries/chocolate-lab-ui` | Chocolate-specific React components: entity views, editors, variation selector, save dialog, AI interactor slot, etc. |
| `@fgv/chocolate-lab-web` | `apps/chocolate-lab-web` | The application. Webpack + Tailwind. |

### Dependency Graph

```
chocolate-lab-web
  ├── chocolate-lab-ui
  │     ├── ts-app-shell
  │     ├── ts-chocolate (browser index)
  │     ├── ts-utils
  │     ├── ts-json-base
  │     ├── ts-web-extras
  │     ├── react / react-dom (peer)
  │     └── @heroicons/react
  ├── ts-chocolate (browser index)
  ├── ts-web-extras (FileTree browser implementations)
  └── (webpack, tailwind, babel — dev)
```

### Build & CI

- Lockstep versioning with the rest of the monorepo.
- Copy Tailwind + Webpack configuration from `ts-res-browser` as starting point. Content paths must span all component source packages.
- Hot reload across packages is unreliable with Webpack in this monorepo — accept kill-and-restart workflow.

---

## 2. State Management

### Architecture

Four distinct state layers, each with its own management approach:

| Layer | Tool | Scope |
|-------|------|-------|
| **Workspace data** | React Context (`WorkspaceContext`) | Global — the loaded `Workspace` instance |
| **UI navigation** | Zustand store | Global — mode, tab, column cascade stack, filter selections, compare mode |
| **Editing state** | `Produced*` wrappers in local component state | Per-column — each editing column owns its wrapper |
| **Messages** | `ObservabilityContext` (existing pattern from ts-res-ui-components) | Global — single stream, rendered as toasts + log |

### Zustand Store Structure

```
NavigationStore:
  mode: 'production' | 'library'
  activeTab: string (per-mode)
  cascadeStack: Array<{ entityType, entityId, mode: 'view' | 'edit', onSave? }>
  filters: Record<tabId, FilterState>  // per-tab persistence
  compareMode: { active: boolean, selectedIds: string[] }
```

### Why Not Other Options

- **Redux:** Too much boilerplate for this scale. Zustand provides the same selector-based re-render optimization with ~1KB.
- **grip-react:** Evaluated (see [owebeeone/grip-react](https://github.com/owebeeone/grip-react)). Architecturally interesting (hierarchical context graph maps well to column cascade), but too early-stage (v0.1.0, single maintainer, no production track record). Risk too high for a project of this scope. May revisit if it matures.
- **Immutable workspace snapshots:** Workspace is too large and dynamic for practical immutable snapshots.

---

## 3. Workspace Reactivity

### Reactive Wrapper Pattern

The `Workspace` class in ts-chocolate is mutable and has no event system. Rather than adding React/event dependencies to a library that also runs in Node/CLI, we wrap it:

- **`ReactiveWorkspace`** — lives in `chocolate-lab-ui` (or `ts-app-shell`). Wraps `Workspace`, delegates all mutation calls, emits typed events after each mutation.
- **`useWorkspace()` hook** — wraps `useSyncExternalStore` to subscribe to `ReactiveWorkspace` events and trigger re-renders.

### Event Granularity

Start coarse:
- `library-changed` — any recipe, ingredient, mold, procedure, or task change
- `session-changed` — any session creation, status transition, or edit
- `inventory-changed` — any inventory update

Refine to per-entity-type or per-entity events later if profiling shows unnecessary re-renders.

### Browser Workspace & Two-Phase Init

1. **Device config** — app loads a device-specific config file that identifies:
   - Local storage root (default)
   - Additional roots (filesystem via File System Access API, or other storage)
   - App-specific settings
2. **Workspace construction** — device config is used to build the full set of `FileTree` instances pointing to configs and data, which are passed to `createBrowserWorkspace`.
3. **Multi-root from the start** — the workspace model already supports multiple roots. Wire up local storage as the default root and support additional roots defined in device config. This avoids local storage size limits (~5-10MB) and provides a natural path to filesystem persistence.

### Concurrent Editing

Single-tab assumption for V1. No locking or conflict detection across browser tabs.

---

## 4. Observability & Error Handling

### Wiring

- **Every component** accesses and uses the `ObservabilityContext`.
- The context provides a log reporter that integrates with `Result.report` for seamless error surfacing through result chains.
- Default reporting levels: `detail` for success, `warning` for errors. Adjustable via `IResultReportOptions`.

### Rendering

- **Toasts** for immediate user feedback (save confirmations, session creation, errors).
- **Log panel** (collapsible bottom bar) for persistent message history, filterable by severity.
- Both render from the same underlying message stream in the `ObservabilityContext`.

### Future Extensions

- Extend the reporter to trigger toasts or display badges directly (rather than just logging).
- Add dev-mode diagnostic logging if needed.

---

## 5. Testing Strategy

### Stack

- `@testing-library/react` + `jest` (same as `ts-res-ui-components`)
- `@fgv/ts-utils-jest` for Result matchers (`toSucceed`, `toFail`, `toSucceedWith`, etc.)

### Mock Workspace

- `TestWorkspace` factory in ts-chocolate that creates pre-populated workspaces from fixture data.
- Factory accepts fixture data as input parameters (not hard-coded) — designed to adapt to generated test data in the future.
- Reusable across both library tests and UI component tests.

### Scope

- **V1:** Component-level tests. Focus on functionality, both positive and negative, including edge cases and error conditions.
- **Future:** Browser-level integration tests (Playwright) for end-to-end workflows.
- Coverage assessment at the end of each development phase, per existing repo guidelines.

---

## 6. ts-chocolate Library Changes (Phase 0)

### Entity Model Changes

All changes are breaking (acceptable — ts-chocolate is new with no external dependents).

- **Session entity base:** Add optional `group: string` field (group identifier in journal entry spec format: `YYYY-MM-DD-tag`)
- **Journal entry types:** Add `group-notes` entry type for session group metadata
- **Recipe entities:** Add optional back-reference field linking adapted recipes to their source
- **Library settings:** Add configurable adapted recipe name suffix (default: `" (adapted)"`)

### Browser Workspace

- Flesh out `createBrowserWorkspace` with local storage FileTree backing
- Support two-phase init (device config → full workspace construction)
- Support multi-root (local storage default + additional roots from device config)
- Move browser workspace factory to an appropriate location (currently lives in the workspace packlet but shouldn't)

### Data

- `data/published/chocolate` at the repo root is source of truth for built-in library data.
- Changes target user entities (not affected by built-in data).
- If library entity schemas change: update data → `rushx data:sync` → `rushx build:data`.

---

## 7. Implementation Phases

### Phase 0: Foundation
**Scope:** Prerequisites that block UI work.

- ts-chocolate entity model changes (session groups, journal entry types, recipe back-references, settings)
- Browser workspace with local storage FileTree + multi-root + two-phase init
- Package scaffolding: `ts-app-shell`, `chocolate-lab-ui`, `chocolate-lab-web`
- Build configuration: Webpack, Tailwind, Babel (copied from ts-res-browser)
- TestWorkspace factory with fixture data support

**Blocks:** Everything else.

### Phase 1: App Shell & Navigation
**Scope:** The outer frame of the application.

- Two-tier top bar (mode selector + view tabs)
- URL state management (mode + tab encoding)
- Zustand store for navigation state
- Settings modal (gear icon → overlay)
- Empty tab views (placeholder content)
- Messages pane (status bar + expandable log, wired to ObservabilityContext)
- Toast system
- Keyboard shortcut registry (infrastructure)
- Browser back/forward interception

**Can start once Phase 0 scaffolding is done (doesn't need entity model changes).**

### Phase 2: Sidebar & List Views
**Scope:** The left sidebar and entity listing.

- Compact sidebar component with flyout filter selectors
- Active filter indicators, quick-clear, "clear all"
- Collection management section (visibility toggles, read-only indicators)
- Entity list view component (reusable across entity types)
- Filter persistence (per-tab Zustand slices)
- Tab-scoped search
- Empty states with CTAs

**Partially parallelizable with Phase 1.**

### Phase 3a: Column Cascade + Ingredients
**Scope:** Core cascade infrastructure + first entity type.

- Column cascade container (horizontal scroll, min-width ~400px, breadcrumb trail)
- List collapse/expand on entity selection
- ReactiveWorkspace wrapper + `useWorkspace()` hook
- Ingredient detail view (read-only)
- Ingredient entity presentation container with AI interactor slot

**Assessment checkpoint:** Interact with ingredients, identify UX/technical tweaks before proceeding.

### Phase 3b: Fillings
**Scope:** Second entity type — validates cascade drill-down.

- Filling detail view (read-only) with variation selector
- Cascade drill-down: filling → ingredient
- Variation switching (in-place replacement)

**Assessment checkpoint:** Test-drive cascade behavior, identify tweaks.

### Phase 3c: Remaining Library Entities + Compare Mode
**Scope:** Complete the Library read-only experience.

- Confection detail view (filling slots, chocolate spec, mold reference)
- Mold, Procedure, Task detail views
- Compare mode (list-view multi-select + comparison view)
- Variation comparison shortcut ("Compare Variations" on a recipe)
- "Open alongside" for side-by-side variation viewing

**Assessment checkpoint before Phase 4:** Confirm no surprises in the read-only experience.

### Phase 4a: Editing (Library Collections)
**Scope:** Make Library collections editable.

- Collection management additions to sidebar
- Collection as filter - show and hide collection contents 
- Collection management - Add from file, create new, remove
- Visual indicator for immutable collections - cannot be deleted
- Visual indicator for protected (encrypted) collections indicating if they've been unlocked.  Command to enter password to unlock locked collections.
- Indicator for collections with unsaved changes.  Auto-save and manual save.

### Phase 4b: Editing (Library)
**Scope:** Make Library entities editable.

- Produced* wrapper integration (editing context per column)
- Undo/redo (Cmd+Z / Cmd+Shift+Z, toolbar buttons, wired to `canUndo()`/`canRedo()`)
- Save dialog with contextual options (edit in place / new variation / new recipe)
- Compact icon-based change summary in save dialog
- Name → ID auto-derivation (display name only, derived ID in secondary field)
- Adapted recipe naming (configurable suffix, back-reference to source)
- Variation spec auto-generation (date portion auto, optional identifier suffix)
- Unsaved changes guard (navigation blocking + save/cancel modal)
- Save callback pattern (child returns new entity identity to parent)
- AI interactor: ingredient copy/paste implementation

### Phase 5: Production Mode
**Scope:** The Production side of the application. Broken into sub-phases — see [Production UX Master Plan](./production-ux-master-plan.md) for details.

#### Critical Architecture Rule: Materialized Objects Only

**The UI layer must NEVER work with raw entity interfaces (`IFillingSessionEntity`, `IConfectionSessionEntity`, `AnySessionEntity`, etc.).** All UI components consume materialized runtime objects — the same pattern used throughout Library mode.

This rule exists because:
- Materialized objects wrap entities and expose properties through accessors (e.g., `FillingRecipe` wraps `IFillingRecipeEntity` and exposes `.name`, `.id`, `.entity`, `.goldenVariation`, etc.)
- Materialized objects carry resolved references (the filling, its ingredients, procedures) — the UI should never manually parse IDs to re-resolve things the runtime already resolved
- Entity interfaces are internal data-layer concerns; the runtime layer exists precisely to shield consumers from them

**Concrete example — how Library tabs work (the pattern to follow):**
```typescript
// FillingsTab iterates materialized FillingRecipe objects, NOT IFillingRecipeEntity
const { entities: fillings } = useEntityList<LibraryRuntime.FillingRecipe, FillingId>({
  getAll: () => workspace.data.fillings.values(), // yields materialized objects
  compare: (a, b) => a.name.localeCompare(b.name), // uses runtime accessors
  ...
});

// FillingDetail receives a FillingRecipe and accesses .name, .variations, etc.
<FillingDetail filling={filling} ... />
```

**How sessions must work (same pattern):**
```typescript
// SessionsTab must iterate materialized sessions, NOT raw entities
const sessions = useMemo(() => {
  return Array.from(workspace.userData.sessions.values()); // yields AnyMaterializedSession
}, [workspace, reactiveWorkspace.version]);

// SessionDetailView receives a materialized EditingSession and accesses
// .baseRecipe, .produced.snapshot.ingredients, .status, .label, etc.
<SessionDetailView session={materializedSession} ... />
```

#### Cross-Entity Identity Contract: Composite IDs for App State

This applies to **all Production entities** (sessions, journals, ingredient inventory, mold inventory, and future additions):

- Use **composite IDs** (`collectionId.baseId`-style identifiers) for all UI app-state identity:
  - cascade `entityId`
  - list row keys
  - selected/checked IDs
  - navigation/deep-link IDs
- Use **base IDs** for display and grouping only.
- Never resolve records by base ID alone when reading/updating app state.
- Never use suffix matching (`endsWith(baseId)`) for selection.

If a UI component needs both forms, pass both explicitly and keep the contract clear:
- `id` = composite ID (identity)
- `baseId` = human-readable short ID (display)

#### UI–Runtime Boundary: No Entity Leakage

Hooks and action callbacks in the UI layer should return **composite IDs** or **materialized objects** — never raw entity interfaces. Entity interfaces are data-layer internals; exposing them to React components breaks the materialized-object contract and invites the anti-patterns listed below.

- **Action hooks** (e.g., `useSessionActions`, `useEntityActions`) that create or mutate entities should return the resulting composite ID (`SessionId`, `FillingId`, etc.) or `Result<compositeId>`. The caller can then look up the materialized object via `workspace.userData.sessions.get(id)` if needed.
- **Query hooks** that return lists or single items should return materialized objects, not entities.
- If a hook currently returns an entity type (e.g., `Result<IFillingSessionEntity>`), refactor it to return the composite ID instead. This keeps the entity confined to the runtime layer where it belongs.

#### Phase 5 Pre-Requisite: Extend Materialized Session Classes

Before building any UI, the materialized session classes (`EditingSession`, `ConfectionEditingSessionBase`) must expose session metadata through accessors — following the same pattern as `FillingRecipe`, `IngredientBase`, etc.

**Current gap:** `EditingSession.fromPersistedState()` receives the full `IFillingSessionEntity` but only uses it to restore editing history. It discards the metadata fields (`status`, `label`, `baseId`, `createdAt`, `updatedAt`, `group`, `notes`, `procedureProgress`). Same for `ConfectionEditingSessionBase`.

**Required changes in ts-chocolate (before UI work begins):**

1. **`EditingSession`** — store the source `IFillingSessionEntity` during `fromPersistedState()` and expose:
   - `.baseId: BaseSessionId`
   - `.sessionType: PersistedSessionType` (always `'filling'`)
   - `.status: PersistedSessionStatus`
   - `.label: string | undefined`
   - `.group: GroupName | undefined`
   - `.createdAt: string`
   - `.updatedAt: string`
   - `.notes: ReadonlyArray<ICategorizedNote> | undefined`
   - `.procedureProgress: ProcedureProgressMap | undefined`
   - `.sourceVariationId: FillingRecipeVariationId`
   - `.entity: IFillingSessionEntity` (the underlying entity, same pattern as `FillingRecipe.entity`)

2. **`ConfectionEditingSessionBase`** — same pattern for `IConfectionSessionEntity` fields, plus:
   - `.confectionType: ConfectionType`
   - `.childSessionIds: Record<SlotId, SessionId>`

3. **`AnyMaterializedSession`** — consider a common interface (`IMaterializedSessionBase`?) so UI components can access shared metadata (status, label, baseId, timestamps, etc.) without type-narrowing.

4. **Freshly created sessions** (via `EditingSession.create()`, not restored from persisted state) won't have metadata yet. These sessions need sensible defaults or the creation flow needs to persist first, then materialize. The `createFillingSession` action in `useSessionActions` already persists then adds — so the materialized library will restore from the persisted entity, which has all fields.

**Anti-patterns to avoid (things the first attempt got wrong):**

| Anti-Pattern | Correct Pattern |
|---|---|
| `for (const [id, entity] of workspace.userData.sessions.entries())` with `entity: AnySessionEntity` | `entries()` on a `MaterializedLibrary` yields materialized objects (`AnyMaterializedSession`), not entities |
| Manually parsing `sourceVariationId` to find a filling (`vid.indexOf('::')`, `workspace.data.fillings.get(fillingId as never)`) | Use `session.baseRecipe` — the materialized session already holds the resolved `IFillingRecipeVariation` |
| Reading `session.history.current.ingredients` to display ingredient lists | Use `session.produced.snapshot.ingredients` or `session.produced.ingredients` — the `ProducedFilling` has the current state |
| UI components typed to accept `Entities.Session.AnySessionEntity` | UI components accept `AnyMaterializedSession` or specific materialized types |
| Using `baseId` as list key or cascade identity (`entityId`) | Use composite ID for identity; use `baseId` for label/display only |

#### Phase 5a: Sessions

- Session list with grouped view (`session.group ?? session.status`)
- Session creation via cascade panel with recipe typeahead (see below)
- Session detail view (recipe + procedure checklist split)
- Session lifecycle transitions (planning → active → committed → abandoned)

**Session creation — cascade panel with recipe typeahead:**

Session creation uses a `CreateSessionPanel` component rendered in the cascade (consistent with all other entity creation). No modal.

- **`ICascadeEntry` extension:** Optional `createSessionInfo?: ICreateSessionInfo` field carries pre-fill data (confectionId, fillingId, variationSpec, entityName) for cross-tab navigation from Library.
- **Recipe typeahead:** Combined confection+filling datalist using `useDatalistMatch` (same union-type discriminator pattern as ConfectionEditView's filling+ingredient datalist). Type filter (Any/Confection/Filling) narrows suggestions.
- **Blur/resolution behavior:**
  1. Single match: auto-select recipe, set type
  2. Zero/multiple matches + specific type: push entity create form onto cascade (via `onAddConfection(seed)` / `onAddFilling(seed)`)
  3. Zero/multiple matches + type="Any": inline disambiguation "Create as: [Confection] [Filling]" (same pattern as ConfectionEditView `pendingNewFilling`)
- **Filling variation selector:** Shown when filling recipe selected; defaults to golden variation.
- **Entry points:** "+ New Session" button atop session list (standalone, empty); "Start Session" on confection/filling detail views (navigates to sessions tab, pushes pre-filled cascade entry).
- **After creation:** Session ID returned by `useSessionActions`, cascade squashes to view mode for the new session.

**Implementation sequence:**
1. Extend `EditingSession` and `ConfectionEditingSessionBase` with metadata accessors (ts-chocolate)
2. Build `SessionListView` consuming `AnyMaterializedSession` — use `.status`, `.label`, `.baseId`, `.group` accessors
3. Build `SessionDetailView` consuming materialized sessions — use `.baseRecipe` for recipe info, `.produced` for current editing state, `.status`/`.label`/etc. for metadata
4. Wire `SessionsTab` using `workspace.userData.sessions.values()` (materialized iterator)
5. Build `CreateSessionPanel` with recipe typeahead, wire into SessionsTab cascade create mode
6. Wire "Start Session" from ConfectionsTab/FillingsTab: navigate to sessions tab + push pre-filled cascade entry
#### Phase 5b: Journal & Inventory
Journal list/detail, inventory CRUD, commit flow. Same materialized-only rule applies — use `workspace.userData.journals.values()` and inventory equivalents.

#### Phase 5c: Cross-References & Integration
Related Activity panel, inventory popovers on Library views.

#### Testing Guidance: Active Development vs Stabilization

During active feature development, optimize for **functional confidence** over line-by-line coverage chasing:

- Prioritize broad functional tests that cover:
  - happy-path workflows
  - failure handling
  - important edge cases and regressions
- Keep tests resilient to expected refactors while architecture and UX are still moving.
- Do not block iteration on temporary measured-coverage dips during active churn.

Before declaring a phase stable (or promoting from provisional to complete), run a hardening pass:

- tighten/refactor tests for final APIs and UX
- close temporary coverage gaps
- restore full repository coverage expectations for stabilized code

### Phase 6: Polish & Cross-Cutting
**Scope:** Refinement and nice-to-haves.

- Responsive design pass (tablet/phone breakpoints, column cascade mobile fallback)
- Drag-and-drop (procedure step reorder, session reorder within groups, filling slot assignment)
- Command palette (Cmd+K)
- Browser back/forward integration with column cascade
- Deep linking refinement
- Sidebar collapse to icons
- Performance profiling + event granularity refinement
- Manual session ordering within groups
- Batch operations for grouped production entities (select-all, multi-transition, and bulk action UX)

---

## 8. Opportunistic Backlog

Items identified during development that aren't blocking but should be picked up when convenient (e.g., next time we're debugging in the relevant area).

### Messages Window Improvements
*Identified during persistence debugging — detail-level diagnostic messages exist but aren't visible without code changes.*

- **Filter control** — add severity filter (detail/info/warning/error) to the messages panel to control which messages are displayed and which trigger toast notifications
- **Copy messages** — add a "Copy Messages" button to the messages panel for easy sharing of log output
- **Persist filter settings** — save the filter configuration in workspace settings so debug-level visibility survives page reloads

These would let developers insert `detail`-level diagnostic messages in production code and enable them on demand via the UI when debugging, without rebuilding.

### Other

- Refactor node `createWorkspaceDirectories` to delegate to the FileTree-based `ensureWorkspaceDirectoriesInTree` (reduce duplication)

---

## 9. Key Technical Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | React Context + Zustand + local state | Proven, minimal, fits existing patterns |
| Workspace reactivity | Reactive wrapper with coarse events | Keeps ts-chocolate UI-free; refine granularity later |
| Component library | Separate `ts-app-shell` for generic + `chocolate-lab-ui` for domain | Reusable primitives, clean separation |
| Build tooling | Webpack + Tailwind + Babel | Consistent with ts-res-browser; Vite has monorepo limitations |
| Testing | @testing-library/react + jest | Same as ts-res-ui-components |
| Browser persistence | Local storage FileTree (default) + multi-root | Avoids size limits, supports future filesystem roots |
| Error handling | ObservabilityContext + Result.report | Unified logging through result chains |
| Concurrent editing | Single-tab assumption | Acceptable risk for V1 |
| Hot reload | Kill-and-restart | Known limitation, not worth fighting |
