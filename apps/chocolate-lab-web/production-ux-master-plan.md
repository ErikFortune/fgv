# Production UX Master Plan

This document breaks Phase 5 (Production Mode) from the [Technical Plan](./chocolate-lab-technical-plan.md) into independently deliverable sub-phases. Each sub-phase is intended to be executed as a full feature workflow (requirements → design → implementation → test → review).

See also: [UX Design Decisions §6 (Production Mode)](./chocolate-lab-ux-plan.md#6-production-mode) and [§7 (Cross-References)](./chocolate-lab-ux-plan.md#7-library--production-cross-references).

---

## Infrastructure Status

All data models and library infrastructure are complete in ts-chocolate:

| Capability | Location | Status |
|-----------|----------|--------|
| Session entities & converters | `ts-chocolate/packlets/sessions` | Ready |
| SessionLibrary (indexing, CRUD, cross-collection queries) | `ts-chocolate/packlets/sessions` | Ready |
| Journal entities & converters | `ts-chocolate/packlets/journals` | Ready |
| JournalLibrary | `ts-chocolate/packlets/journals` | Ready |
| Inventory entities & converters | `ts-chocolate/packlets/inventory` | Ready |
| MoldInventoryLibrary, IngredientInventoryLibrary | `ts-chocolate/packlets/inventory` | Ready |
| IUserLibrary (workspace.userData) | `ts-chocolate/packlets/workspace` | Ready |
| ReactiveWorkspace | `chocolate-lab-ui/packlets/workspace` | Ready |
| Navigation store (production tabs, cascade types) | `chocolate-lab-ui/packlets/navigation` | Ready |
| Sidebar filter configs (sessions, journal, inventory) | `chocolate-lab-ui/packlets/sidebar` | Ready |

No production UI components exist yet — all four production tabs are placeholders in App.tsx.

---

## Phase 5a: Sessions — List, Creation, Detail & Lifecycle

**Goal:** The core production experience — users can create, view, manage, and transition sessions.

### Scope

#### Session Creation
- Sessions are created via a **cascade panel** (consistent with all other entity creation flows), not a modal
- **Entry points:**
  - "+ New Session" button atop the session list (standalone creation with recipe typeahead)
  - "Start Session" action on confection/filling detail views (navigates to Sessions tab, opens cascade pre-filled)
- **Recipe typeahead** in the create panel:
  - Type filter: Any / Confection / Filling (pre-set when launched from a specific recipe)
  - Combined datalist of all confections + fillings (uses `useDatalistMatch`)
  - Blur behavior: single match auto-selects; zero/multiple matches with specific type pushes entity create form; with type "Any" shows inline "Create as: Confection / Filling" disambiguation
  - Filling recipes show a variation selector (defaults to golden variation)
- Session fields: label (display name), slug (kebab-case ID suffix, auto-derived from label)
- Session created in `planning` status with editing history initialized from source variation

#### Session List
- "+ New Session" button above the list (disabled when no mutable collection exists)
- Grouped view: `session.group ?? session.status`
- Group headers with group name and metadata (from `group-notes` journal entries)
- Status filter in sidebar
- Click to open in cascade
- Empty state with CTA

#### Session Detail View
- Recipe display (produced confection/filling with current editing state)
- Procedure checklist (steps displayed as tickable checklist during `active` status)
- Split layout within the column (recipe alongside procedure) — see UX plan §6
- Cross-mode cascade drill-down (session → confection → filling → ingredient)
- Session metadata (status, created/updated dates, notes, group)

#### Session Lifecycle
- Status transitions: `planning` → `active` → `committed` / `abandoned`
- Transition actions in session detail toolbar
- `committing` intermediate state during save
- Recipe remains editable during `active` (real-world adjustments)

#### Session Groups
- Optional `group` field on sessions (format: `YYYY-MM-DD-tag`)
- Group-notes journal entries for group metadata
- Group header in session list linked to group notes
- Handle tag reuse across dates (disambiguate by showing date alongside tag)

### Key Patterns to Follow

**CRITICAL — Materialized objects only (see [Technical Plan §7, Phase 5](./chocolate-lab-technical-plan.md#phase-5-production-mode) for full rationale):**
- UI components consume materialized session objects (`EditingSession`, `AnyConfectionEditingSession`), NEVER raw entity interfaces (`IFillingSessionEntity`, `AnySessionEntity`)
- `workspace.userData.sessions.entries()` and `.values()` yield **materialized** objects, not entities — this is how `MaterializedLibrary` works (same as `workspace.data.fillings.values()` yielding `FillingRecipe`, not `IFillingRecipeEntity`)
- Access session metadata (status, label, group, timestamps) through materialized object accessors, not by reading entity fields
- Access recipe/ingredient data through the materialized session's runtime references (`.baseRecipe`, `.produced`), not by manually parsing IDs from `sourceVariationId`

**CRITICAL — Identity contract (all Production entities):**
- Use composite IDs (`collectionId.baseId` style) for app-state identity: cascade `entityId`, list keys, selected IDs, checked IDs, and deep-link targets.
- Use base IDs for display/grouping only.
- Never resolve or compare selected entities by base ID alone.

**Other patterns:**
- Entity list: reuse `useEntityList` hook pattern from Library tabs
- Cascade: push `{ entityType: 'session', entityId, mode }` onto cascade stack
- Filtering: use existing sidebar filter infrastructure with `sessions` filter config

**Pre-requisite:** The materialized session classes must be extended with metadata accessors before UI work begins — see Technical Plan Phase 5 pre-requisite section.

### Assessment Checkpoint
After 5a, the user should be able to:
- Create a session from a Library recipe
- See it in the Sessions tab grouped by status
- Open it, view the recipe and procedure steps
- Transition it through lifecycle states

### Testing Guidance for 5a Delivery
- During active implementation, prioritize broad functional confidence (happy path, failure paths, and key edge cases) over line-by-line coverage optimization.
- Keep tests robust to expected refactors while architecture and UX are still in flux.
- Before closing 5a as stable, run a hardening pass that tightens tests and restores full coverage expectations for stabilized code.

---

## Phase 5b: Journal & Inventory

**Goal:** Complete the remaining Production tabs — journal for historical records, inventory for stock tracking.

### Scope

#### Commit Flow (Session → Journal)
- Committing a session creates a journal entry
- Capture actual yield (quantity produced)
- Option to save updated variation back to library (edit in place / new variation / new recipe — reuses save dialog from Phase 4b)
- Journal entry links back to source session and recipe

#### Journal Tab
- Chronological list of journal entries
- Filterable by entry type (`confection-production`, `filling-production`, `confection-edit`, `filling-edit`, `group-notes`)
- Journal entry detail view in cascade
- Display: production yields, notes, linked recipes, timestamps
- Read-only (journal entries are immutable records)
- Click-through to source recipe in Library (cross-mode drill-down)

#### Ingredient Inventory Tab
- List of ingredient inventory entries
- CRUD operations (add, edit, remove entries)
- Fields: ingredient reference, quantity, unit, location, notes
- Link to ingredient definition in Library
- Empty state with CTA

#### Mold Inventory Tab
- List of mold inventory entries
- CRUD operations (add, edit, remove entries)
- Fields: mold reference, count, location, notes
- Link to mold definition in Library
- Empty state with CTA

### Dependencies
- **Phase 5a must be complete** — the commit flow depends on session lifecycle being functional

### Assessment Checkpoint
After 5b, the user should be able to:
- Commit a completed session and see the journal entry
- Browse journal history with filtering
- Track ingredient and mold inventory
- Navigate from journal/inventory entries to Library entities

---

## Phase 5c: Cross-References & Integration

**Goal:** Connect Production and Library modes with contextual cross-references.

### Scope

#### Related Activity Panel (Library Views)
- Collapsible panel that slides in from the right edge of Library entity views
- **Collapsed state:** Compact dashboard with small icon/badge pairs and counts (e.g., 📋3 journal entries, ▶1 active session)
- **Expanded state:** Overlays right portion of entity view with read-only list of related production data
- Items can expand inline for detail or open lightweight overlay
- Journal entries are view-only from Library context
- Available on: confection, filling, ingredient, mold views

#### Inventory Popover (Library Views)
- Inventory badge on ingredient and mold entity views
- Popover anchored to badge for quick inventory updates
- Fields: location, notes, quantity/count
- Richer than a simple +/- control (see UX plan §7)

#### Data Queries
- Sessions related to a recipe: `SessionLibrary.getSessionsForConfection()`, `getSessionsForFilling()`
- Sessions related to a variation: `getSessionsForConfectionRecipeVariation()`, `getSessionsForFillingRecipeVariation()`
- Journal entries for a recipe/variation (similar cross-reference queries)
- Inventory for ingredient/mold by ID

### Dependencies
- **Phases 5a and 5b must be complete** — cross-references only make sense when production data exists

### Assessment Checkpoint
After 5c, the user should be able to:
- See production activity badges on Library entity views
- Expand the Related Activity panel for details
- Quickly update inventory from Library views
- Navigate from Library to related Production data

---

## Execution Notes

- Each sub-phase should be executed as a **standard-feature workflow** (TPM → design → implementation → review → test → validation)
- Follow established patterns from Library mode (entity list, cascade, editing, filtering)
- Production mode components go in new packlets under `chocolate-lab-ui/src/packlets/` (e.g., `sessions/`, `journal/`, `inventory/`)
- Tab implementations go in `chocolate-lab-web/src/tabs/`
- Tests follow the same patterns as Library tab tests
- Batch operations are intentionally deferred until a later stabilization/polish pass
