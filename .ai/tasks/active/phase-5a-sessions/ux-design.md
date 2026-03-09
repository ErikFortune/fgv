# Phase 5a UX Design: Sessions — Production Mode Core Experience

**Date:** 2026-02-28
**Phase:** 5a (Production Mode — Sessions)
**Status:** UX Design Complete
**Designer:** UX Designer Agent

---

## Executive Summary

This document provides comprehensive UX design for Phase 5a Sessions, focusing on layout, interaction patterns, visual design, and mobile-friendly kitchen use. The design respects the established column cascade paradigm while introducing new patterns for production workflow tracking.

### Key UX Decisions

1. **Session Detail Layout:** Standard cascade drill-down — session detail in one column, procedure in next column (with session-aware progress overlay)
2. **Group Organization:** Expandable group headers with metadata preview and inline editing
3. **Session ID Derivation:** Real-time preview with highlighted auto-incremented infix
4. **Procedure Interaction:** Existing procedure cascade panel enhanced with progress tracking (checkboxes, timestamps)
5. **Status Transitions:** Contextual toolbar buttons with confirmation flows for destructive actions
6. **Cross-Mode Differentiation:** Subtle blue-tinted background for Library entities accessed from Production

---

## 1. Session Detail Layout (CRITICAL DECISION)

### The Layout Challenge

The column cascade paradigm expands **horizontally** — each entity drills down to the right. The session detail view must work within this paradigm, not fight it.

### Decision: Standard Cascade Drill-Down with Session-Aware Procedure View

**REVISED** — The original vertical split proposal was rejected because:
- In landscape tablet orientation (the expected kitchen use case), a vertical split produces two tiny unreadable rows
- A separate slide-out or overlay would introduce a new interaction paradigm that exists nowhere else in the app
- **Procedures are already entities** with their own cascade panel and detail view. What's missing is session-aware progress tracking, not a new procedure display.

**Layout:** Session detail occupies one cascade column. Clicking the procedure drills into the **existing procedure cascade panel**, enhanced with a session progress overlay (checkboxes, timestamps) when viewed in the context of an active session.

**Rationale:**
- **Cascade consistency:** Uses the exact same drill-down paradigm as everything else in the app
- **Reuse:** Procedures already have a detail view, a sub-library, and cascade rendering. We add a progress layer, not a parallel view.
- **Landscape tablet:** Horizontal layout gives each column adequate width for readability
- **No new paradigms:** No overlays, no slide-outs, no vertical splits — just the cascade

### Cascade Flow

```
Session List → Session Detail → Procedure (with progress) → Task Detail
                    ↓
              Ingredient Detail (cross-mode drill-down)
```

### Session Detail Column

```
┌─────────────────────────────────────────────┐
│ Session Toolbar                             │
│ [Start Production] [Commit] [Abandon]       │
├─────────────────────────────────────────────┤
│                                             │
│ Session name + status badge                 │
│ Source recipe (linked)                      │
│                                             │
│ Ingredient list (clickable → cascade)       │
│ • Dark chocolate (70%) - 500g →             │
│ • Heavy cream - 250g →                      │
│ • Glucose syrup - 50g →                     │
│                                             │
│ Yield: 800g                                 │
│ Mold, chocolates (confections only)         │
│                                             │
│ Procedure: Classic Ganache Method →         │
│   Progress: 3/10 steps complete             │
│                                             │
│ Notes (categorized, editable)               │
│                                             │
│ Session Metadata                            │
│ Group: Easter Production →                  │
│ Tags: dark-chocolate, ganache               │
│ Created: 2026-02-28                         │
│ Updated: today                              │
│                                             │
└─────────────────────────────────────────────┘
```

The procedure appears as a clickable link with a progress summary. Clicking it opens the procedure detail in the next cascade column — but with the session's progress state overlaid.

### Procedure Column (Session-Aware)

When a procedure is opened from a session context, the existing procedure detail view gains a progress overlay:

```
┌─────────────────────────────────────────────┐
│ Procedure: Classic Ganache Method           │
│ Progress: 3 of 10 steps complete            │
├─────────────────────────────────────────────┤
│                                             │
│ ☑ Step 1: Melt chocolate      10:15 AM     │
│   Heat to 45-50°C using double boiler →    │
│                                             │
│ ☑ Step 2: Heat cream          10:18 AM     │
│   Heat to 85°C, do not boil →              │
│                                             │
│ ☑ Step 3: Combine and emulsify 10:25 AM    │
│   Mix until smooth and homogeneous →       │
│                                             │
│ ☐ Step 4: Cool to 32°C                     │
│   Monitor temperature carefully →          │
│                                             │
│ ☐ Step 5: Pipe into molds                  │
│   Use star tip, fill to 90% →              │
│                                             │
│ ... (scrollable)                            │
│                                             │
└─────────────────────────────────────────────┘
```

- Checkboxes enabled only when session status is `active`
- Each step drills down to task detail (existing cascade)
- Completion timestamps shown inline
- The `→` on each step description allows drill-down to the task entity
```

### Responsive Behavior

Standard cascade responsive behavior applies — no special layout needed:

**Desktop (1024px+):**
- Session detail and procedure visible side-by-side as cascade columns
- Further drill-down (task, ingredient) scrolls earlier columns off-screen

**Tablet Landscape (768px-1023px):**
- Same cascade behavior, columns at min-width ~400px
- Two columns visible (session + procedure), list collapses to strip

**Tablet Portrait / Mobile (< 600px):**
- Cascade falls back to stacked navigation (see Phase 6 responsive design pass)
- Session detail full-screen, procedure opens as next screen with back-navigation

---

## 2. Session List with Groups

### Grouped List Display

**Grouping Logic:**
- Sessions grouped by `session.group ?? session.status`
- Explicit groups take precedence over status-based fallback
- Groups are expandable/collapsible with state persisted

**Group Header Design:**

```
┌─────────────────────────────────────────────────────────┐
│ ▼ Easter Production (2026-04-05-easter)        [3]  📝  │
│   Target: April 12, 2026                                │
│   Planning notes: Need extra molds for bunny shapes...  │
└─────────────────────────────────────────────────────────┘
  ┌───────────────────────────────────────────────────────┐
  │ Dark Ganache Truffles          🟡 Planning            │
  │ Created 2026-02-28 • Updated 2026-03-01               │
  │ Tags: dark-chocolate, ganache                         │
  └───────────────────────────────────────────────────────┘
  ┌───────────────────────────────────────────────────────┐
  │ Raspberry Caramel Bonbons      🟢 Active              │
  │ Created 2026-02-28 • Updated today                    │
  │ Tags: caramel, fruity                                 │
  └───────────────────────────────────────────────────────┘
```

**Group Header Components:**

1. **Expand/collapse icon:** Chevron (▼ expanded, ▶ collapsed)
2. **Group name:** Bold, with full group identifier in parentheses if ambiguous
3. **Session count badge:** `[3]` — number of sessions in group
4. **Edit notes icon:** Pencil icon (📝) clickable to open group notes modal
5. **Metadata preview:** Target date and first note (truncated to 1 line)

**Group Header Interaction:**
- Clicking anywhere on header toggles expand/collapse
- Clicking pencil icon opens group notes modal (stops propagation)
- Hover state: subtle background highlight (`hover:bg-gray-50`)

### Session List Item Design

**Layout:**

```
┌───────────────────────────────────────────────────────┐
│ Dark Ganache Truffles               🟡 Planning       │
│ Source: Classic Dark Ganache (base)                   │
│ Created 2026-02-28 • Updated 2026-03-01               │
│ Tags: dark-chocolate, ganache                         │
└───────────────────────────────────────────────────────┘
```

**Components:**

1. **Session name:** Bold, left-aligned (session label or derived from source recipe)
2. **Status badge:** Right-aligned, color-coded pill
3. **Source recipe:** Small text with link to Library view (cross-mode drill-down)
4. **Timestamps:** Created and last updated, de-emphasized gray text
5. **Tags:** Pill-style tags (same as Library views)

**Status Badge Colors:**

| Status       | Color               | Rationale                              |
|--------------|---------------------|----------------------------------------|
| Planning     | Yellow/Amber        | Caution: not started yet               |
| Active       | Green               | Go: in progress                        |
| Committing   | Blue                | Info: processing                       |
| Committed    | Gray                | Neutral: completed, archived           |
| Abandoned    | Red                 | Alert: cancelled, did not complete     |

**Interaction:**
- Clicking session item opens session detail in cascade (collapses list)
- Hover state: subtle background highlight
- No inline actions (edit/delete) — actions available in detail view toolbar

### Empty State

**No sessions exist:**

```
┌─────────────────────────────────────────┐
│                                         │
│          📋 No production sessions yet  │
│                                         │
│   Create your first session from a      │
│   Library recipe by clicking            │
│   "Start Session" in any filling or     │
│   confection detail view.               │
│                                         │
│   [Browse Library Recipes →]            │
│                                         │
└─────────────────────────────────────────┘
```

**Filtered to no results:**

```
┌─────────────────────────────────────────┐
│                                         │
│    No sessions match current filters    │
│                                         │
│    [Clear Filters]                      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 3. Session Creation Modal

### Modal Layout

**Title:** "Create Production Session"

**Fields:**

1. **Session Name** (required)
   - Pre-populated with `"[Recipe Name] - [Date]"`
   - Full-width text input
   - Label: "Session Name"

2. **Session ID** (auto-derived, editable)
   - Three-part display: `YYYY-MM-DD-` **`XX`** `-user-tag`
   - Date portion: read-only gray text (current date)
   - Infix: **highlighted in color** (auto-incremented counter)
   - Tag: editable text input (derived from session name via kebab-case)
   - Real-time preview: "Full ID: 2026-02-28-01-dark-ganache"
   - Collision warning: "Session with this tag exists — using next available ID"

3. **Tags** (optional)
   - Multi-value tag input (same component as Library views)
   - Label: "Tags (optional)"

4. **Group** (optional)
   - Dropdown/autocomplete with existing groups
   - Format validation: `YYYY-MM-DD-tag`
   - Label: "Group (optional)"
   - Placeholder: "Select or create group..."

5. **Initial Status** (dropdown)
   - Options: Planning (default), Active
   - Label: "Initial Status"
   - Rationale: Allow direct creation in Active status for immediate execution

**Actions:**
- **Cancel** button (left, secondary style)
- **Create Session** button (right, primary style, disabled if validation fails)

### ID Derivation Interaction

**User Flow:**

1. User enters session name: `"Dark Ganache Truffles"`
2. System auto-derives tag: `dark-ganache-truffles`
3. System checks for collisions and determines infix: `01`
4. Full ID preview updates: `2026-02-28-01-dark-ganache-truffles`
5. User can edit tag portion (e.g., shorten to `dark-ganache`)
6. Infix auto-updates on blur if collision detected: `2026-02-28-02-dark-ganache`
7. Real-time feedback: "Updated to next available ID"

**Visual Feedback:**

```
┌───────────────────────────────────────────────────────┐
│ Session ID                                            │
│ ┌───────────────────────────────────────────────────┐ │
│ │ 2026-02-28-  [01]  -dark-ganache                  │ │
│ │              ^^^^                                  │ │
│ │              highlighted in blue/amber             │ │
│ └───────────────────────────────────────────────────┘ │
│ Full ID: 2026-02-28-01-dark-ganache                   │
│                                                       │
│ ⓘ Infix auto-increments if tag already exists        │
└───────────────────────────────────────────────────────┘
```

### Modal Responsive Behavior

**Desktop:** Modal width ~600px, centered
**Tablet:** Modal width 90% viewport, max-width 600px
**Mobile:** Full-screen modal (100% width/height) with scroll

---

## 4. Procedure Checklist Interaction

### Checklist Visual Design

**Enabled State (Active status):**

```
☐ Step 1: Melt chocolate
  Heat to 45-50°C using double boiler or microwave
  Time: 5-10 minutes

☑ Step 2: Heat cream
  Heat to 85°C, do not boil
  Completed: 2026-02-28 10:32 AM
  Time: 3-5 minutes
```

**Disabled State (Planning, Committed, Abandoned):**

```
☐ Step 1: Melt chocolate (read-only)
  Heat to 45-50°C using double boiler or microwave
  Time: 5-10 minutes
```

### Checklist Item Components

1. **Checkbox** (44x44px touch target)
   - Enabled: Interactive, hover feedback, ripple effect on tap
   - Disabled: Grayed out, no hover state
   - Checked: Green checkmark fill (`text-green-600`)

2. **Step Number + Task Name** (bold)
   - Unchecked: Normal weight, dark text (`text-gray-900`)
   - Checked: Strikethrough, lighter text (`text-gray-400 line-through`)

3. **Task Description** (smaller text)
   - Always visible, not affected by checked state
   - Gray text (`text-gray-600`)

4. **Time Constraint** (if specified)
   - Format: "Time: 5-10 minutes" or "Temperature: 32°C"
   - Smaller italicized text (`text-xs italic text-gray-500`)

5. **Completion Timestamp** (when checked)
   - Format: "Completed: 2026-02-28 10:32 AM"
   - Small gray text (`text-xs text-gray-400`)
   - Only visible for checked steps

### Interaction Behavior

**Checking a step (Active status):**
1. User taps/clicks checkbox
2. Checkbox animates to checked state (smooth transition)
3. Step text fades to gray with strikethrough (300ms transition)
4. Completion timestamp appears below step
5. Session entity updated with `procedureProgress` field
6. Change persists immediately

**Unchecking a step (Active status):**
1. User taps/clicks checkbox
2. Checkbox animates to unchecked state
3. Step text returns to normal weight and color
4. Completion timestamp removed
5. Session entity updated
6. Change persists immediately

**Disabled interaction (Planning, Committed, Abandoned):**
- Checkboxes visible but grayed out (`opacity-50`)
- No hover state, no pointer cursor
- Clicking has no effect
- Read-only visual preview of procedure

### Kitchen-Friendly Design

**Touch Targets:**
- Minimum 44x44px for all interactive elements
- Extra padding around checkboxes (48x48px actual target)
- Adequate spacing between steps (min 16px vertical gap)

**Visual Clarity:**
- High contrast text (4.5:1 ratio minimum)
- Clear visual differentiation between checked/unchecked
- Large font sizes (min 14px for task names, 12px for descriptions)

**Audio Feedback (Future Enhancement):**
- Soft "tick" sound when checking step (kitchen environment may be noisy)
- Haptic feedback on mobile devices
- Deferred to post-MVP based on user testing

---

## 5. Status Transitions

### Toolbar Actions by Status

**Planning Status:**

```
┌─────────────────────────────────────────────┐
│ [Start Production]          [Abandon ▾]     │
└─────────────────────────────────────────────┘
```

- **Start Production** (primary button, green): Transitions to Active
- **Abandon** (dropdown, secondary): Shows confirmation dialog

**Active Status:**

```
┌─────────────────────────────────────────────┐
│ [Commit Session]            [Abandon ▾]     │
└─────────────────────────────────────────────┘
```

- **Commit Session** (primary button, blue): Opens journal preview modal
- **Abandon** (dropdown, secondary): Shows confirmation dialog

**Committed / Abandoned Status:**

```
┌─────────────────────────────────────────────┐
│ (No actions — read-only)                    │
└─────────────────────────────────────────────┘
```

- Toolbar shows status badge only
- No transition actions available
- Session is archived/historical record

### Transition Flows

**Planning → Active (Start Production):**

1. User clicks "Start Production"
2. Immediate transition (no confirmation)
3. Status updates to Active
4. Procedure checklist enables (checkboxes become interactive)
5. Toast notification: "Session started"
6. Toolbar updates to Active actions

**Active → Committed (Commit Session):**

1. User clicks "Commit Session"
2. System constructs journal entry from current session state
3. Journal preview modal opens (see Section 6)
4. User reviews journal entry
5. User clicks "Commit" in modal
   - Status transitions to Committing (intermediate)
   - Status transitions to Committed
   - Toast: "Session committed"
   - Modal closes
6. User clicks "Cancel" in modal
   - Session remains Active
   - Modal closes

**Active/Planning → Abandoned:**

1. User clicks "Abandon" dropdown
2. Confirmation dialog appears:
   - Title: "Abandon Session?"
   - Message: "This session will be marked as abandoned. Work will not be saved to the library."
   - Actions: [Cancel] [Abandon Session]
3. User clicks "Abandon Session"
   - Status updates to Abandoned
   - Toast: "Session abandoned"
   - Dialog closes
4. User clicks "Cancel"
   - No change, dialog closes

### Visual Feedback

**Button States:**

| State       | Visual Treatment                                      |
|-------------|------------------------------------------------------|
| Default     | Solid background, white text, hover darkens          |
| Hover       | Background darkens 10%, smooth transition            |
| Active      | Background darkens 20%, slight scale-down (98%)      |
| Disabled    | Grayed out (`opacity-50`), no hover, no pointer      |
| Processing  | Spinner icon, "Processing..." text, disabled         |

**Toast Notifications:**

- Position: Top-right corner
- Duration: 3 seconds (5 seconds if actionable link)
- Style: Colored background matching action (green for success, blue for info, red for error)
- Icon: Checkmark for success, info icon for neutral, X for error

---

## 6. Journal Entry Preview

### Preview Modal Layout

**Title:** "Journal Entry Preview"

**Content Sections:**

1. **Entry Metadata**
   - Entry type: `filling-production` or `confection-production`
   - Timestamp: Commit time (ISO format, localized)
   - Source recipe: Link to Library view (cross-mode)

2. **Produced Recipe Snapshot**
   - Ingredient list with resolved choices
   - Yield (actual produced amount)
   - Notes (merged session notes + recipe notes)
   - Mold/chocolates (confections only)

3. **Procedure Progress Summary**
   - Steps completed count: "8 of 10 steps completed"
   - List of completed steps with timestamps
   - List of skipped steps (unchecked)

**Actions:**
- **Cancel** (secondary button): Close modal, session remains Active
- **Commit Session** (primary button): Confirm commit, transition to Committed

### Preview Content Design

**Entry Metadata Section:**

```
┌───────────────────────────────────────────────────────┐
│ Entry Details                                         │
│ ─────────────────────────────────────────────────────│
│ Type: Filling Production                              │
│ Timestamp: 2026-02-28 14:32:15                        │
│ Source: Classic Dark Ganache (base)                   │
└───────────────────────────────────────────────────────┘
```

**Produced Recipe Section:**

```
┌───────────────────────────────────────────────────────┐
│ Produced Recipe                                       │
│ ─────────────────────────────────────────────────────│
│ Ingredients:                                          │
│ • Dark chocolate (70%) - 500g                         │
│ • Heavy cream - 250g                                  │
│ • Glucose syrup - 50g                                 │
│                                                       │
│ Yield: 800g (target: 800g)                            │
│                                                       │
│ Notes:                                                │
│ - Used Valrhona Guanaja chocolate                     │
│ - Cream heated to 85°C                                │
└───────────────────────────────────────────────────────┘
```

**Procedure Progress Section:**

```
┌───────────────────────────────────────────────────────┐
│ Steps Completed (8 of 10)                             │
│ ─────────────────────────────────────────────────────│
│ ✓ Melt chocolate (10:15 AM)                           │
│ ✓ Heat cream (10:18 AM)                               │
│ ✓ Combine and emulsify (10:25 AM)                     │
│ ✓ Cool to 32°C (11:45 AM)                             │
│ ✓ Pipe into molds (12:00 PM)                          │
│ ✓ Tap to release air bubbles (12:05 PM)               │
│ ✓ Refrigerate 2 hours (2:15 PM)                       │
│ ✓ Unmold and finish (2:30 PM)                         │
│                                                       │
│ Skipped Steps:                                        │
│ • Temper chocolate (optional for this batch)          │
│ • Add flavor extract (not used)                       │
└───────────────────────────────────────────────────────┘
```

### Modal Behavior

**Read-Only Preview:**
- All content is read-only, no inline editing
- User can scroll through preview for long entries
- If user wants to modify data, they cancel and edit session before re-committing

**Confirmation:**
- "Commit Session" button clearly labeled
- No ambiguous "OK" or "Save" terminology
- Clear consequence: "This will mark the session as committed and create a journal entry"

**Cancellation:**
- "Cancel" button returns to Active session
- No changes made to session status
- User can continue working, check more steps, then re-commit

---

## 7. Cross-Mode Visual Differentiation

### The Challenge

When drilling from a Production session into Library entities (ingredient, filling, mold), the user is **still in Production mode** — they haven't switched tabs or modes. The UX plan specifies "slightly different background tone and/or breadcrumb trail" to visually differentiate cross-mode columns.

### Design Decision: Subtle Blue Tint

**Visual Treatment:**
- Library entities accessed from Production mode render with subtle blue-tinted background
- Background color: `bg-blue-50` (very light blue, ~5% opacity)
- Border remains standard gray (`border-gray-200`)
- All other styling identical to Library mode presentation

**Example:**

```
Session Column          Ingredient Column (cross-mode)
┌─────────────────┐    ┌─────────────────────────────┐
│                 │    │  [bg-blue-50 background]    │
│ Session Detail  │ →  │  Dark Chocolate (70%)       │
│                 │    │  Category: Chocolate        │
│ Ingredient:     │    │  Cocoa: 70%                 │
│ > Dark Chocolate│    │  ...                        │
│   (clickable)   │    │                             │
│                 │    └─────────────────────────────┘
└─────────────────┘
```

**Rationale:**
- **Subtle differentiation:** Blue tint is noticeable but not jarring
- **Production context:** Blue suggests "information/reference" rather than "editable"
- **Breadcrumb reinforcement:** Mode stays "Production" in top bar, breadcrumb shows path
- **Accessibility:** Color is supplementary, not sole differentiator (breadcrumb provides text alternative)

### Breadcrumb Trail Enhancement

**Standard Library breadcrumb:**
`Fillings > Classic Dark Ganache > Dark Chocolate`

**Cross-mode breadcrumb (from Production):**
`Production / Sessions > Dark Ganache Session > Dark Chocolate`

- Mode prefix: `Production / Sessions` (bold)
- Path separator: `>` for cascade drill-down
- Entity names clickable to navigate back up

---

## 8. "Start Session" in Library Views

### Button Placement

**Location:** Toolbar actions area of filling/confection detail views (right side, after existing actions)

**Visual Style:**
- Icon: Play icon (▶) from Heroicons
- Text: "Start Session"
- Color: Green background (`bg-green-600`)
- Size: Small button (`text-xs`)
- Hover: Darkens background (`hover:bg-green-700`)

**Example (Filling Detail View):**

```
┌─────────────────────────────────────────────────────────┐
│ Classic Dark Ganache                                    │
│ Tags: ganache, dark-chocolate         [Edit] [▶ Start  │
│                                               Session]  │
│ ─────────────────────────────────────────────────────────│
│ Ingredients:                                            │
│ ...                                                     │
└─────────────────────────────────────────────────────────┘
```

**Interaction:**
1. User clicks "Start Session"
2. Session creation modal opens (pre-populated with recipe name)
3. User fills out session details (name, group, tags, status)
4. User clicks "Create Session"
5. Modal closes, user **remains in Library mode**
6. Toast notification appears: "Session created" with "Go to Session" link
7. User can click "Go to Session" to navigate to Production → Sessions → opened session
8. Or user can dismiss toast and continue browsing Library

### Toast with Navigation Link

**Design:**

```
┌─────────────────────────────────────────────┐
│ ✓ Session created                           │
│   Dark Ganache Truffles                     │
│                                             │
│   [Go to Session →]                         │
└─────────────────────────────────────────────┘
```

- Duration: 5 seconds (longer than standard toast due to action link)
- Action link: "Go to Session →" (blue underlined text)
- Clicking link navigates to Production mode, Sessions tab, session detail open in cascade
- Dismissible via X button or clicking outside toast

---

## 9. Group Management

### Group Assignment Interface

**Location:** Session detail view, metadata section

**Design:**

```
┌───────────────────────────────────────────────────────┐
│ Session Metadata                                      │
│ ─────────────────────────────────────────────────────│
│ Session ID: 2026-02-28-01-dark-ganache                │
│ Created: 2026-02-28 09:15 AM                          │
│ Updated: Today at 2:30 PM                             │
│                                                       │
│ Group: [Easter Production (2026-04-05-easter)    ▾]  │
│        (or "No group" if unassigned)                  │
│                                                       │
│ Tags: dark-chocolate, ganache, easter                 │
└───────────────────────────────────────────────────────┘
```

**Dropdown Interaction:**

1. User clicks group dropdown
2. Dropdown opens with existing groups (autocomplete/filter)
3. User can:
   - Select existing group from list
   - Type to filter groups
   - Type new group name with format validation (`YYYY-MM-DD-tag`)
   - Select "No group" to clear assignment
4. User selects/enters group
5. Dropdown closes, group updates immediately
6. Session entity persisted
7. Toast: "Session moved to group [name]"
8. Session list refreshes to show session in new group

**Group Validation:**
- Format: `YYYY-MM-DD-tag` (e.g., `2026-04-05-easter`)
- Invalid format: Red border, error message "Invalid group format (expected YYYY-MM-DD-tag)"
- Duplicate tag handling: Show warning "Group 'easter' exists for multiple dates — using 2026-04-05-easter"

### Group Notes Editing

**Trigger:** Clicking pencil icon (📝) on group header in session list

**Modal Layout:**

**Title:** "Group Notes: Easter Production"

**Fields:**

1. **Group Name** (read-only)
   - Display only, derived from group identifier
   - Format: "Easter Production (2026-04-05-easter)"

2. **Target Date** (optional)
   - Date picker input
   - Label: "Target Production Date"
   - Placeholder: "Select date..."

3. **Categorized Notes** (optional)
   - Multi-note editor with category selection
   - Categories: Planning, Production, Results, General
   - Each note:
     - Category dropdown
     - Multiline text area
     - Remove button (X icon)
   - Add Note button (+ icon)

**Actions:**
- **Cancel** (secondary): Close modal, no changes
- **Save Group Notes** (primary): Persist to journal collection, refresh group header

**Modal Design:**

```
┌───────────────────────────────────────────────────────┐
│ Group Notes: Easter Production                        │
├───────────────────────────────────────────────────────┤
│                                                       │
│ Group: Easter Production (2026-04-05-easter)          │
│                                                       │
│ Target Date: [April 12, 2026              ▾]         │
│                                                       │
│ Notes:                                                │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Category: [Planning           ▾]      [X]       │   │
│ │ ┌─────────────────────────────────────────────┐ │   │
│ │ │ Need extra molds for bunny shapes          │ │   │
│ │ │ Order by March 15                           │ │   │
│ │ └─────────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────┘   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Category: [Production         ▾]      [X]       │   │
│ │ ┌─────────────────────────────────────────────┐ │   │
│ │ │ Schedule 2 full days for piping and setting │ │   │
│ │ └─────────────────────────────────────────────┘ │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ [+ Add Note]                                          │
│                                                       │
│                        [Cancel]  [Save Group Notes]   │
└───────────────────────────────────────────────────────┘
```

### Group Header Metadata Display

**With Notes:**

```
┌─────────────────────────────────────────────────────────┐
│ ▼ Easter Production (2026-04-05-easter)        [3]  📝  │
│   Target: April 12, 2026                                │
│   Planning: Need extra molds for bunny shapes...        │
└─────────────────────────────────────────────────────────┘
```

**Without Notes:**

```
┌─────────────────────────────────────────────────────────┐
│ ▼ Easter Production (2026-04-05-easter)        [3]  📝  │
│   (No notes)                                            │
└─────────────────────────────────────────────────────────┘
```

**Tag Disambiguation:**

If the same tag is used across different dates (e.g., "birthday" in March and July):

```
┌─────────────────────────────────────────────────────────┐
│ ▼ Birthday (March 2026)                        [2]  📝  │
│   2026-03-15-birthday                                   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ ▼ Birthday (July 2026)                         [1]  📝  │
│   2026-07-20-birthday                                   │
└─────────────────────────────────────────────────────────┘
```

- Month and year appended to disambiguate
- Full group identifier shown as subtitle

---

## 10. Mobile and Tablet Considerations

### Kitchen Environment Requirements

**Primary Use Case:** Tablet in kitchen during active production

**Key Requirements:**
1. **Touch-friendly targets:** All interactive elements min 44x44px
2. **High contrast:** Readable in bright kitchen lighting
3. **Moisture resistance:** Avoid swipe gestures that fail with wet fingers
4. **Large fonts:** Min 14px for task names, 12px for descriptions
5. **Offline resilience:** Graceful degradation when connectivity drops

### Responsive Layout Breakpoints

**Desktop (1024px+):**
- Full column cascade with list sidebar
- Session detail: vertical split (recipe 40%, checklist 60%)
- All actions visible in toolbar

**Tablet Landscape (768px-1023px):**
- Column cascade maintained
- List sidebar collapses to icon strip when session open
- Session detail: vertical split maintained
- Touch targets enlarged (48x48px)

**Tablet Portrait (600px-767px):**
- List sidebar full-width when browsing
- Cascade columns stack vertically when session open
- Session detail: recipe section collapsible accordion
- Checklist section takes majority of viewport

**Mobile (< 600px):**
- Full-screen views with back navigation
- No cascade (drill-down replaces current view)
- Session detail: recipe section collapsed by default
- Checklist section full-screen
- Floating action button for status transitions

### Touch Interaction Enhancements

**Checklist Checkboxes:**
- Tap target: 48x48px (larger than desktop 44x44px)
- Visual feedback: Ripple animation on tap
- No double-tap required (single tap toggles)

**Group Headers:**
- Tap to expand/collapse (no hover state)
- Tap pencil icon to edit notes (larger target area)

**Session List Items:**
- Single tap opens session detail
- No long-press actions (avoid accidental triggers with wet hands)

**Toolbar Actions:**
- Buttons min 44px height
- Adequate spacing between buttons (min 8px gap)
- Clear labels (no icon-only buttons on mobile)

### Offline Behavior

**Session Creation:**
- Allow creation offline (queued for sync)
- Visual indicator: "Will sync when online"

**Procedure Progress:**
- Persist checked state locally
- Sync when connection restored
- Conflict resolution: last-write-wins

**Cross-Mode Drill-Down:**
- Cache Library entities for offline access
- Show cached data with "Offline" badge
- Disable editing (view-only mode)

---

## 11. Accessibility

### Keyboard Navigation

**Session List:**
- Arrow up/down: Navigate between session items
- Enter: Open selected session
- Escape: Close session detail, return to list

**Procedure Checklist:**
- Tab: Navigate between checkboxes
- Space: Toggle checked state
- Arrow down: Next step
- Arrow up: Previous step

**Modals:**
- Tab: Cycle through form fields
- Enter: Submit (when focus on primary button)
- Escape: Cancel and close modal

### Screen Reader Support

**Session List:**
- Announce: "Session list, 5 groups, 12 total sessions"
- Group headers: "Easter Production, 3 sessions, expand/collapse button"
- Session items: "Dark Ganache Truffles, status: Planning, created February 28, link"

**Procedure Checklist:**
- Announce: "Procedure checklist, 10 steps, 3 completed"
- Step items: "Step 2, Heat cream, checkbox checked, completed 10:32 AM"
- Disabled state: "Step 1, Melt chocolate, checkbox, read-only"

**Status Transitions:**
- Announce: "Start Production button, press to transition session to Active status"
- Confirmation dialogs: "Abandon Session? This session will be marked as abandoned..."

### Color and Contrast

**Status Badges:**
- Color is supplementary, not sole indicator
- Text labels always present (Planning, Active, Committed, Abandoned)
- Minimum contrast ratio: 4.5:1 for all text

**Procedure Checklist:**
- Strikethrough + color change for completed steps (dual encoding)
- Disabled checkboxes: opacity + cursor change (not color alone)

**Cross-Mode Differentiation:**
- Blue tint background + breadcrumb text (dual encoding)
- Not reliant on color alone

---

## 12. Visual Design Specifications

### Color Palette

**Status Colors:**

| Status       | Background      | Text            | Border          |
|--------------|-----------------|-----------------|-----------------|
| Planning     | `bg-amber-100`  | `text-amber-800`| `border-amber-300` |
| Active       | `bg-green-100`  | `text-green-800`| `border-green-300` |
| Committing   | `bg-blue-100`   | `text-blue-800` | `border-blue-300` |
| Committed    | `bg-gray-100`   | `text-gray-800` | `border-gray-300` |
| Abandoned    | `bg-red-100`    | `text-red-800`  | `border-red-300` |

**Procedure Checklist:**

| Element           | Unchecked         | Checked            |
|-------------------|-------------------|--------------------|
| Checkbox          | `border-gray-300` | `bg-green-600 text-white` |
| Task name         | `text-gray-900 font-medium` | `text-gray-400 line-through` |
| Description       | `text-gray-600`   | `text-gray-400`    |
| Timestamp         | N/A               | `text-gray-400 text-xs` |

**Cross-Mode Differentiation:**
- Background: `bg-blue-50` (Library entities accessed from Production)
- Border: `border-gray-200` (unchanged)

### Typography

**Headings:**
- Session name: `text-lg font-semibold text-gray-900`
- Section titles: `text-xs font-semibold text-gray-500 uppercase tracking-wider`
- Group headers: `text-sm font-semibold text-gray-800`

**Body Text:**
- Primary: `text-sm text-gray-900`
- Secondary: `text-xs text-gray-600`
- De-emphasized: `text-xs text-gray-400`
- Monospace (IDs): `text-xs font-mono text-gray-500`

**Buttons:**
- Primary: `text-sm font-medium text-white`
- Secondary: `text-sm font-medium text-gray-700`
- Destructive: `text-sm font-medium text-red-700`

### Spacing

**Section Margins:**
- Between sections: `mb-4` (16px)
- Section padding: `p-4` (16px)
- List item padding: `px-3 py-2` (12px horizontal, 8px vertical)

**Component Spacing:**
- Checklist steps: `gap-y-2` (8px vertical gap)
- Group header to sessions: `mt-1` (4px)
- Tag list gaps: `gap-1` (4px)

**Touch Targets:**
- Desktop: `44x44px` minimum
- Tablet: `48x48px` minimum
- Actual interactive area can be larger than visual element (padding extends target)

### Borders and Shadows

**Dividers:**
- Section borders: `border-b border-gray-200`
- Card borders: `border border-gray-200 rounded`

**Elevation:**
- Modals: `shadow-2xl` (deep shadow for prominence)
- Dropdowns: `shadow-lg` (moderate shadow for floating)
- Cards: `shadow-sm` (subtle shadow for depth)
- Hover states: `shadow-md` (slight lift on hover)

---

## 13. Wireframe Descriptions

### Session List View (Full Layout)

```
┌─────────────────────────────────────────────────────────────────┐
│ Top Bar: Production | Sessions | Journal | Inventory           │
├──────────────┬──────────────────────────────────────────────────┤
│ Sidebar      │ Main Pane: Session List                          │
│              │                                                  │
│ Search       │ ▼ Easter Production (2026-04-05-easter)  [3] 📝 │
│ [_______🔍]  │   Target: April 12, 2026                         │
│              │   Planning: Need extra molds...                  │
│ Status:  All │   ┌────────────────────────────────────────────┐ │
│          [›] │   │ Dark Ganache Truffles    🟡 Planning       │ │
│              │   │ Source: Classic Dark Ganache                │ │
│ Tags:  None  │   │ Created 2026-02-28                          │ │
│          [›] │   └────────────────────────────────────────────┘ │
│              │   ┌────────────────────────────────────────────┐ │
│              │   │ Raspberry Caramel        🟢 Active         │ │
│              │   │ Source: Raspberry Filling                   │ │
│              │   └────────────────────────────────────────────┘ │
│              │                                                  │
│              │ ▼ Planning [5]                              📝  │
│              │   ┌────────────────────────────────────────────┐ │
│              │   │ Espresso Ganache         🟡 Planning       │ │
│              │   └────────────────────────────────────────────┘ │
│              │                                                  │
└──────────────┴──────────────────────────────────────────────────┘
```

### Session Detail with Procedure Drill-Down (Cascade)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ Top Bar: Production | Sessions                                               │
├──────────┬──────────────────────────┬────────────────────────────────────────┤
│ Collapsed│ Session Detail           │ Procedure (session-aware)              │
│ List     │                          │                                        │
│ [<] List │ Dark Ganache Truffles    │ Classic Ganache Method                 │
│          │ 🟢 Active                │ Progress: 3 of 10 steps               │
│          │                          │ ────────────────────────               │
│          │ Source: Classic Dark →    │                                        │
│          │                          │ ☑ Step 1: Melt chocolate   10:15 AM   │
│          │ Ingredients:             │   Heat to 45-50°C →                   │
│          │ • Dark choc (70%) 500g → │                                        │
│          │ • Heavy cream 250g →     │ ☑ Step 2: Heat cream       10:18 AM   │
│          │ • Glucose syrup 50g →    │   Heat to 85°C →                      │
│          │                          │                                        │
│          │ Yield: 800g              │ ☑ Step 3: Combine          10:25 AM   │
│          │                          │   Mix until smooth →                  │
│          │ Procedure:               │                                        │
│          │ Classic Ganache →        │ ☐ Step 4: Cool to 32°C               │
│          │ Progress: 3/10 ████░░    │   Monitor temperature →              │
│          │                          │                                        │
│          │ Notes: Valrhona Guanaja  │ ☐ Step 5: Pipe into molds            │
│          │                          │   Use star tip →                      │
│          │ Group: Easter Prod →     │                                        │
│          │ Tags: dark-choc, ganache │ ... (scrollable)                      │
│          │                          │                                        │
│          │ [Start Prod] [Abandon ▾] │                                        │
└──────────┴──────────────────────────┴────────────────────────────────────────┘
```

### Session Creation Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                   Create Production Session                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Session Name                                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Dark Ganache Truffles - 2026-02-28                          │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Session ID                                                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 2026-02-28-  01  -dark-ganache-truffles                     │ │
│ │              ^^   (editable tag portion)                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│ Full ID: 2026-02-28-01-dark-ganache-truffles                   │
│                                                                 │
│ Tags (optional)                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [dark-chocolate] [ganache]                        [+ Add]   │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Group (optional)                                                │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Easter Production (2026-04-05-easter)                    ▾  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ Initial Status                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Planning                                                  ▾  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│                                [Cancel]  [Create Session]      │
└─────────────────────────────────────────────────────────────────┘
```

### Journal Preview Modal

```
┌─────────────────────────────────────────────────────────────────┐
│                   Journal Entry Preview                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Entry Details                            [bg-gray-50, rounded] │
│ ─────────────────────────────────────────────────────────────  │
│ Type: Filling Production                                        │
│ Timestamp: 2026-02-28 14:32:15                                  │
│ Source: Classic Dark Ganache (base) →                           │
│                                                                 │
│ Produced Recipe                                                 │
│ ─────────────────────────────────────────────────────────────  │
│ Ingredients:                                                    │
│ • Dark chocolate (70%) - 500g                                   │
│ • Heavy cream - 250g                                            │
│ • Glucose syrup - 50g                                           │
│                                                                 │
│ Yield: 800g (target: 800g)                                      │
│                                                                 │
│ Steps Completed (8 of 10)                                       │
│ ─────────────────────────────────────────────────────────────  │
│ ✓ Melt chocolate (10:15 AM)                                     │
│ ✓ Heat cream (10:18 AM)                                         │
│ ✓ Combine and emulsify (10:25 AM)                               │
│ ... (scrollable list)                                           │
│                                                                 │
│                                [Cancel]  [Commit Session]      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Recommendations Differing from Technical Design

### 1. Session ID Display Format

**Technical Design:** Three-part editable input (date-infix-tag)

**UX Recommendation:** Unified input with visual highlighting

**Rationale:**
- Three separate inputs create cognitive load
- Single input with highlighted infix shows structure while simplifying interaction
- Real-time preview below input clarifies full ID
- Users rarely need to edit date or infix manually

**Implementation:**
- Single text input pre-populated with full ID
- Infix portion highlighted via background color or bold text
- Real-time validation and collision detection on blur
- Clear visual feedback when infix auto-increments

### 2. Journal Preview Modal Scope

**Technical Design:** Basic read-only preview

**UX Recommendation:** Enhanced preview with categorized sections

**Rationale:**
- Users need clear understanding of what will be committed
- Categorized sections (metadata, recipe, procedure progress) improve scannability
- Highlighting skipped steps provides important context
- Clear visual differentiation between completed and skipped

**Implementation:**
- Three distinct sections with headers
- Completed steps with timestamps
- Skipped steps listed separately with rationale
- Scrollable content for long entries

### 3. Mobile Checklist Interaction

**Technical Design:** Standard checkboxes

**UX Recommendation:** Enlarged touch targets with visual feedback

**Rationale:**
- Kitchen environment requires reliable interaction with wet/messy hands
- Standard 44x44px may not be sufficient for stressed production scenarios
- Visual feedback (ripple, animation) provides confirmation of tap registration

**Implementation:**
- 48x48px touch targets on tablet/mobile
- Ripple animation on tap
- Smooth transition to checked state (300ms)
- Optional haptic feedback on mobile devices

### 4. Group Header Interaction

**Technical Design:** Clickable header for expand/collapse

**UX Recommendation:** Dedicated chevron icon for expand/collapse, header for notes

**Rationale:**
- Clicking anywhere on header is ambiguous (expand or edit notes?)
- Dedicated chevron icon provides clear affordance
- Header background click opens notes modal (primary action)
- Pencil icon remains secondary affordance

**Alternative (simpler):**
- Keep current design: click anywhere toggles expand/collapse
- Pencil icon opens notes (stops propagation)
- More consistent with standard accordion pattern

**Final Recommendation:** Use alternative (simpler) — header click expands/collapses, pencil icon edits notes. More conventional and less ambiguous.

---

## 15. Implementation Priorities

### High Priority (Must Have for Phase 5a)

1. **Session detail vertical split layout** — Core UX pattern
2. **Procedure checklist interaction** — Primary production workflow
3. **Session ID derivation with real-time feedback** — Critical for usability
4. **Status transition flows** — Core lifecycle management
5. **Group organization with headers** — Essential for multi-session workflows
6. **Cross-mode visual differentiation** — Prevents user confusion

### Medium Priority (Should Have for Phase 5a)

1. **Journal preview modal enhancements** — Improves commit confidence
2. **Group notes editing** — Enables planning workflows
3. **Toast with navigation link** — Fire-and-forget convenience
4. **Mobile touch target enlargement** — Kitchen usability
5. **Empty states** — Professional polish

### Low Priority (Nice to Have / Phase 5b)

1. **Audio feedback on checklist interaction** — Requires user testing to validate
2. **Haptic feedback on mobile** — Platform-specific, deferred
3. **Offline resilience enhancements** — Beyond MVP scope
4. **Advanced keyboard shortcuts** — Power user feature
5. **Session search in list view** — Can use sidebar search as interim

---

## 16. Next Steps for Development Team

### For Senior Developer

1. **Review cascade integration approach** — Confirm vertical split within single column aligns with cascade architecture
2. **Evaluate session restoration complexity** — Confirm EditingSession.fromPersistedState() approach
3. **Cross-mode cascade routing** — Implement mode-aware visual styling (bg-blue-50)

### For Code Monkey

1. **Implement session ID input component** — Real-time derivation, collision detection, visual feedback
2. **Build procedure checklist component** — Touch-friendly checkboxes, smooth transitions, timestamp display
3. **Create status transition toolbar** — Contextual actions, confirmation dialogs
4. **Implement group header component** — Expand/collapse, metadata preview, notes modal trigger

### For UX Designer (Future Phases)

1. **User testing for audio/haptic feedback** — Validate kitchen environment needs
2. **Offline workflow optimization** — Design for intermittent connectivity
3. **Batch operations UX** — Multi-select, batch status transitions (Phase 5b)

---

## 17. Open Questions for Validation

### UX Clarifications Needed

1. **Checked step visual treatment:** Should completed steps remain visible or collapse to summary?
   - **Recommendation:** Remain visible with strikethrough for audit trail
   - **Alternative:** Collapse completed steps with "Show completed" toggle

2. **Group deletion behavior:** If user deletes last session in group, preserve group-notes or auto-delete?
   - **Recommendation:** Preserve group-notes (group may be planned for future)
   - **Alternative:** Prompt user: "Delete group notes as well?"

3. **Session ID infix:** Should it be editable or strictly auto-generated?
   - **Recommendation:** Auto-generated, read-only (simplifies UX)
   - **Alternative:** Editable for power users who want custom numbering

4. **Mobile checklist scroll:** Should recipe section be sticky header or scrollable?
   - **Recommendation:** Scrollable (both sections scroll independently)
   - **Alternative:** Sticky recipe summary header (ingredients collapse to single line)

### Technical Validation Needed

1. **Session restoration performance:** Can EditingSession.fromPersistedState() handle 50-step undo/redo stacks efficiently?
2. **Cross-mode cascade memory:** Will Library entity caching impact memory on mobile devices?
3. **Journal preview rendering:** Can we efficiently render large journal entries (100+ steps) without lag?

---

## Conclusion

This UX design provides comprehensive guidance for Phase 5a Sessions implementation, with a focus on kitchen-friendly interaction, mobile-first responsive design, and seamless integration with the existing column cascade paradigm. The design respects established patterns while introducing new affordances for production workflow tracking.

**Key Innovations:**
- Vertical split session detail for mobile-friendly kitchen use
- Real-time session ID derivation with collision handling
- Group organization with inline metadata editing
- Touch-friendly procedure checklist with clear visual feedback
- Subtle cross-mode differentiation for cognitive clarity

**Next Step:** Review with TPM and senior developer, then proceed to implementation following the priorities outlined in Section 15.
