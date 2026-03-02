# Chocolate Lab Web — UX Design Decisions

This document captures UX design decisions made during review of the [Chocolate Lab Web Plan](./chocolate-lab-plan.md). It is intended to evolve alongside the plan as a record of rationale and agreed-upon behaviors.

---

## 1. Navigation & Mode Switching

### Two-Tier Top Bar
- **Top level:** Mode selector with two modes — **Production** and **Library**.
- **Second level:** Horizontal tabs for the views within the selected mode.
  - **Production tabs:** Sessions, Journal, Ingredient Inventory, Mold Inventory
  - **Library tabs:** Ingredients, Fillings, Confections, Molds, Tasks, Procedures

### Settings
- **Not a mode.** Accessed via a gear icon button that opens a modal/overlay.
- Keeps the top-level navigation clean (only two modes).

### Cross-Mode Drill-Downs
- When drilling from Production into Library entities (e.g., session → confection → filling → ingredient), the **mode indicator stays on Production**. The user is anchored in their starting context.
- Expanded columns are contextual drill-downs, not mode switches.
- Subtle visual hints differentiate cross-mode columns: slightly different background tone and/or a breadcrumb trail showing the entity lineage.

### Deep Linking / URL State
- Plan URL state architecture from the start.
- Encode stable states only: current mode, active tab, selected entity ID.
- No encoding of transient column-cascade state (e.g., mid-edit drill-downs).
- Supports bookmarking and future server-side sharing.

### Browser Back/Forward
- **V1:** Intercept browser back/forward to prevent navigating away from the app and losing context.
- **Future:** Integrate with column cascade (opening a sub-entity pushes a history entry, back closes the rightmost column).
- Design column cascade state management to support history integration without a rewrite.

---

## 2. Column Cascade (Master-Detail Drill-Down)

### Core Behavior
- Strictly hierarchical: each column is a child of the one to its left.
- Minimum column width ~400px. When columns exceed viewport width, earlier columns scroll off-screen to the left.
- **Breadcrumb trail** at the top of the main pane shows the full path and allows jumping back to any ancestor.
- No hard depth limit. 4 levels is the expected practical maximum (e.g., session → confection → filling → ingredient), but the scrolling model supports deeper if needed.

### List Column Behavior
- **No entity selected:** List column takes the full main pane width (browse state).
- **Entity selected:** List column collapses to a narrow strip (icon + selected entity identifier + "back to list" button). The entity detail/edit view takes the first full column.
- **Entity closed:** List re-expands to browse state.
- No quick-select in the collapsed strip for now — can be added later if sequential editing proves awkward.

### Column Lifecycle & Unsaved Changes
- **Save in child column:** Auto-closes the child column. Parent updates immediately to reflect changes, including potentially new entity IDs (new variation or new recipe).
- **Cancel in child column:** Auto-closes. Parent sees no changes.
- **Navigate away with unsaved changes:** Blocked with a save/cancel confirmation modal.
- Child columns support a **save callback** pattern — the child returns the (possibly new) entity identity to the parent, not just a dirty/clean signal.

### Compare Mode
- **Not part of the column cascade.** Comparison is a separate interaction mode.
- Activated via a "Compare" toggle in the list view toolbar.
- Enables multi-select with checkboxes. Selecting 2+ entities (max 3–4) opens a read-only comparison view in the main pane.
- Scoped to same entity type (per-tab).
- **Variation comparison** within a single recipe is a natural shortcut: "Compare Variations" action on a recipe pre-selects its variations.
- Available in Library views. Production views can be added later if needed.

---

## 3. Variation Handling

### View Layout
- **Common recipe properties** at the top (name, tags, linked recipes, collection source).
- **Variation selector** between common and variation-specific sections — compact dropdown or pill showing current variation name + count badge (e.g., "3 variations").
- **Variation-specific properties** below (ingredients, ratios, yield, notes, rating, procedure).

### Switching Variations
- **Default:** Replace in place — selecting a different variation updates the variation-specific section while the common section stays.
- **Side-by-side:** An "open alongside" affordance in the variation selector dropdown opens the selected variation as a new column to the right (reuses column cascade infrastructure).

### Editing Model
- Editing always creates a `Produced*` wrapper (mutable copy with undo/redo).
- A banner or indicator communicates the editing context: *"Editing — changes will be saved as a new variation"* or *"...as a new recipe in [your collection]"* (if source is read-only).
- **Save dialog** presents contextual options:
  - **Source writable + only metadata changed:** "Update in place" (default)
  - **Source writable + ingredients/structure changed:** "Save as new variation" (default) or "Update in place" (with warning)
  - **Source read-only:** "Save as new recipe in [writable collection]" — user can edit the name and pick the target collection
- **Undo/redo** surfaced via Cmd+Z / Cmd+Shift+Z and toolbar buttons, wired to the `Produced*` wrapper's `canUndo()`/`canRedo()` methods.

### Naming & IDs
- User enters a **display name** only. ID is auto-derived via the existing snake-case helper.
- Derived ID shown in a secondary/collapsed field — editable but rarely needed.
- **Adapted recipes** default to `"[Original Name] (adapted)"` (configurable via library settings). A back-reference to the source recipe is stored in the entity data.
- **Variation spec** (`YYYY-MM-DD-NN(-identifier)?`): date portion auto-generated, optional `-identifier` suffix can be suggested from context or left blank. User can edit but doesn't have to.

### Change Summary in Save Dialog
- Compact icon-based presentation using heroicons.
- Row of small icon+indicator pairs for each change category (fillings, yield, notes, procedure, mold, chocolates, etc.).
- Changed items highlighted (bold/colored), unchanged items dimmed.
- Provides at-a-glance diff without taking up significant space.

---

## 4. Sidebar Design

### Layout
- Persistent left sidebar that swaps content based on the active view/tab.
- **Compact filter rows** with summary text and a flyout selector:
  ```
  Search:     [_______________🔍]
  Categories: All              [›]
  Tags:       3 selected       [›]
  Rating:     ★★★+             [›]
  Collection: My Recipes       [›]
  ```
- Clicking `[›]` opens a **flyout panel** that slides out to the right, overlaying the main pane (not displacing it).
- Flyout contains the full selection UI (checkboxes, search-within-filter, select all/none).

### Filter Indicators & Quick Actions
- **Active filter indicator:** Subtle highlight or colored dot on any row that is narrowing results (not "All").
- **Quick clear:** Small ✕ on any non-"All" filter row to reset without opening the flyout.
- **Combined filter count:** Badge at the top (e.g., "3 filters active") with a "Clear all" action.

### Collection Section
- Similar compact layout to filters but with **different interaction semantics**.
- Flyout may stay pinned for action buttons (vs. auto-close on selection for filters).
- Visibility toggles (eye icon) per collection.
- Read-only indicator (lock icon) for non-writable collections.

### Filter Persistence
- Per-tab filter state — switching tabs and back preserves filters.

### Sidebar Collapsibility
- Nice-to-have: sidebar collapses to icons for maximum main-pane space during deep editing.

### Search
- Tab-scoped: searches the current entity type.
- In-recipe ingredient search uses **typeahead**, not the sidebar search.

---

## 5. Messages Pane

### Two-Tier Model
- **Toasts:** Ephemeral notifications (top-right or bottom-right), auto-dismiss after a few seconds. Used for immediate feedback ("Session created", "Recipe saved"). Actionable toasts (with links like "Go to Session") linger longer.
- **Log panel:** Collapsible panel across the bottom of the main pane. Scrollable history of all messages, filterable by severity (info/warning/error/success).

### Data Model
- Single global message stream backed by one ObservabilityContext (from ts-res-ui-components).
- Rendered in two ways (toasts + log) from the same data.
- Mode-based filtering can be added later if the global stream becomes noisy.

### Collapsed State
- Slightly taller status bar (not a thin strip) showing running counts per severity level — info/warning/error icons with counts.
- Clicking expands to the full scrollable log.

---

## 6. Production Mode

### Session Lifecycle
Three phases:
1. **Planning** — Create sessions, adjust recipes/quantities, scale. Can span days/weeks. Multiple sessions planned simultaneously (e.g., Easter production run). Sessions remain fully editable.
2. **Active (In Production)** — Sessions move from planning to active. Multiple sessions can be active simultaneously. Recipes remain editable even during production (real-world adjustments). Procedure steps displayed as a **checklist** the user ticks off.
3. **Committed (Complete)** — Session marked done. Produced recipes saved to the library (edit in place / new variation / new recipe). Remaining data recorded as a journal entry.

Additional statuses: `committing` (in-progress save), `abandoned` (explicitly cancelled).

### V1 Scope
- Status indicator (planning / active / committed / abandoned)
- Step checklist during production
- Simple transition between phases

### Future Enhancements (Plan For, Don't Build Yet)
- Timers triggered by step time constraints
- Target temperature display
- "Up next" preview
- Richer journal entries

### Session Groups
- Sessions have an optional `group` field (identifier in journal entry spec format: `YYYY-MM-DD-tag`, e.g., `2026-04-05-easter`).
- **Group metadata** stored as a `group-notes` journal entry type, keyed by group identifier. Holds notes, target dates, and other metadata.
- UI links group notes to the group header in the session list.
- Handle tag reuse across dates (e.g., "birthday" in March and July) — detect and disambiguate by showing date alongside tag.

### Session List
- **Grouped:** `session.group ?? session.status` — sessions with an explicit group travel together; ungrouped sessions fall back to status-based grouping.
- **Batch operations:** Group header has a "select all in group" checkbox. Selected sessions can be batch-transitioned (e.g., Planning → Active).
- **Manual ordering within groups:** Nice-to-have P1, not required for V1.

### UI Placement
- Sessions live in the Sessions tab within Production mode.
- Active session is a detail view using the column cascade.
- Session detail may use a **split within the column** (procedure checklist alongside recipe view) rather than separate columns.

---

## 7. Library → Production Cross-References

### Related Activity Panel
- Collapsible element that **slides in from the right edge** of the entity view.
- **Collapsed:** Compact dashboard with small icons/badges and counts (e.g., 📋3 journal entries, ▶1 active session).
- **Expanded:** Overlays the right portion of the editing view with a read-only list of related production data (recent journal entries, active/pending sessions, usage frequency).
- Items can expand inline for read-only detail or open a lightweight overlay for full detail.
- **Journal entries are view-only** from Library context.

### Start Session from Library
- Available for both **fillings and confections**.
- Fire-and-forget action: creates the session in the background.
- Toast notification with "Go to Session" link. User stays in Library mode.

### Update Inventory from Library
- **Popover** anchored to an inventory badge on the entity view.
- Accommodates richer data (location, notes, quantity) — not just a simple +/- control.

---

## 8. AI Integration

### V1: Improved Copy/Paste
- "Ask AI" button generates a well-formatted prompt (entity schema, context, instructions) and copies to clipboard.
- "Paste AI Response" drop zone validates the returned JSON through the Converters pipeline before applying.
- Start with **ingredients** — the highest-value use case (searching the web for ingredient data).

### Architecture: AI Interactor Slot
- Build an **optional AI interactor slot** into the base entity presentation container.
- Each entity type opts in by providing an AI interactor configuration (prompt template, response schema, field mapping).
- Adding AI to new entity types becomes configuration, not component rewriting.

### Future Expansion
- Different AI interaction modes per entity type:
  - **Ingredients:** Web search for nutritional/technical data
  - **Recipes:** Parse a supplied web page or pasted PDF
  - **Procedures:** Generate step sequences from descriptions
- Direct API integration (OpenAI, Anthropic, etc.) as an alternative "AI provider" behind the same UI surface.
- All responses validated through the existing Converters pipeline regardless of transport.

---

## 9. Cross-Cutting Concerns

### Keyboard Shortcuts
Plan from the start. Key bindings include:
- **Cmd+K:** Command palette (quick navigation — switch tabs, open entity by name, start session)
- **Cmd+Z / Cmd+Shift+Z:** Undo/redo (wired to Produced* wrapper stacks)
- **Escape:** Close the rightmost column
- **Enter:** Submit in text fields
- Component architecture should support keybinding registration.

### Empty States
- Every view has a designed empty state with clear calls-to-action (e.g., "Create your first filling recipe", "Import ingredients").
- Include in the plan so they don't get forgotten during implementation.

### Drag-and-Drop
Plan in the component model for:
- Reordering procedure steps
- Reordering sessions within a group
- Dragging a filling onto a confection slot
- Implement incrementally.

### Responsive Design
- Design for responsive from the start — **critical for kitchen use** on tablets and phones.
- Column cascade mobile fallback: collapse to a stack with back-navigation.
- Sidebar collapses on narrow viewports.
- Touch-friendly tap targets throughout.

### Undo/Redo
- Already built into the `Produced*` wrappers (50-deep undo/redo stacks).
- UI surfaces via keyboard shortcuts and toolbar buttons.
- `canUndo()` / `canRedo()` drive button enabled/disabled state.

---

## 10. Typeahead On-Blur Pattern

A consistent app-wide affordance for all typeahead/datalist inputs.

### Behavior

On blur (or Enter/Tab) from a typeahead field:
1. **1 match** — Auto-select it. The field commits the matched entity.
2. **0 or >1 matches** — Open a create/resolve cascade in the next panel. The typed text is passed as a prefill name to the create form.

### Tiered Suggestions

Typeahead fields support **priority suggestions** that appear first in the datalist, separated from the full list by a visual divider:
- **Ingredient fields in sessions:** Variation alternates appear first, then all ingredients.
- **Procedure fields in sessions:** Variation procedures appear first, then all procedures.

Priority suggestions are checked first during blur resolution, so alternates are preferred over the global list when names overlap.

### Implementation

- `useDatalistMatch(suggestions, prioritySuggestions?)` — Hook that provides `findExactMatch` and `resolveOnBlur` with tiered matching.
- `buildTieredSuggestions(all, priority)` — Combines priority + remaining items with a separator for `<datalist>` rendering.
- `onRequestCreateEntity(entityType, prefillName)` — Callback from the editing panel to the parent tab, which opens a create form via `squashCascade`.

### Rationale

This pattern eliminates "unresolved" error states from typeahead fields. Instead of showing an inline error when the user types something that doesn't match, the app proactively helps them create the missing entity. The cascade column pattern makes this feel natural — the create form appears in the next panel, and on save, the user returns to the original editing context.
