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

### Phase 4: Editing (Library)
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
**Scope:** The Production side of the application.

- Session list with grouped view (`session.group ?? session.status`)
- Session creation (from Library "Start Session" action + toast with link)
- Session detail view (recipe + procedure checklist split)
- Session lifecycle transitions (planning → active → committed → abandoned)
- Batch operations (group select + batch status change)
- Session groups (group field, group-notes journal entries, group header with metadata)
- Related Activity panel (Library → Production cross-reference, collapsible slide-in)
- Inventory update popover (location, notes, quantity)
- Journal view (read-only list + detail)

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

---

## 8. Key Technical Decisions Summary

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
