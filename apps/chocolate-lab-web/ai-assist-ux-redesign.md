# AI Assist UX Redesign — Cascade-Native Create + List Drop Target

Replace the modal "New Ingredient" dialog with a cascade-native `'create'` stage and a drop target on the list header, eliminating the modal and aligning with the app's cascade interaction model.

---

## Design: D+B (Cascade Create Stage + List Drop Target)

### Rationale

The current modal dialog is redundant — clicking "Create" in the modal opens a cascade edit column anyway. By making the "create" flow a stage within the cascade column itself, we:
- Eliminate the modal-to-cascade transition
- Align with the app's existing interaction model
- Create a pattern that generalizes to all entity types

### Two Entry Points

**1. "+ New Ingredient" button → opens a `'create'`-mode cascade column**

The list collapses as usual. The cascade column shows a lightweight create form:

```
Breadcrumb: List / New Ingredient
┌─────────────────────────────────────────┐
│  Ingredient Name                        │
│  [________________________]             │
│                                         │
│  ID                                     │
│  [________________________] (auto)      │
│                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│  │  🎯 Paste or drop AI JSON here   │  │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│                                         │
│  [✨ Copy AI Prompt]  [Cancel] [Create] │
└─────────────────────────────────────────┘
```

- All fields always visible. No progressive disclosure.
- **Copy AI Prompt**: Disabled until name forms a valid ID. Copies to clipboard, shows brief "Copied!" confirmation.
- **Create**: Disabled until name is non-empty. Creates blank ingredient, morphs column to `'edit'` mode.
- **Paste/drop valid JSON**: Parses, creates entity, morphs column to `'edit'` mode with all fields populated.
- **Cancel / Escape**: Closes column, re-expands list.

**2. 🎯 Drop target icon button on the list header**

```
┌──────────────────────────────────────┐
│  [+ New Ingredient]  [🎯]           │
│──────────────────────────────────────│
│  Callebaut 811 Dark                  │
│  ...                                 │
```

- Clicking the target icon reads clipboard via `navigator.clipboard.readText()`, parses JSON, creates entity, opens directly in `'edit'` mode cascade column. Skips the create stage entirely.
- If parse fails: shows error as a toast message.
- If clipboard is empty/denied: shows informational toast.

### Cascade Column Lifecycle

```
"+ New Ingredient"          🎯 Drop target
       │                         │
       ▼                         │
  mode: 'create'                 │
  (create form)                  │
       │                         │
  ┌────┴────┐                    │
  │ Create  │  Paste/Drop        │
  │ (blank) │  (AI JSON)         │
  └────┬────┘     │              │
       │          │    Parse + create
       ▼          ▼              │
  mode: 'edit'  ◄────────────────┘
  (IngredientEditView)
       │
  ┌────┴────┐
  │  Save   │  Cancel
  └────┬────┘    │
       ▼         ▼
  mode: 'view'  (close)
```

### Why B Alone Is Sufficient (No Drop Zone in Create Column Needed?)

Actually, we **do** want the drop zone in the create column too:
- The user might click "+ New Ingredient" first, then realize they have AI data to paste. The drop zone in the create column handles this.
- The list header target handles the fast path when the user already has data on the clipboard.
- No redundancy: different entry points for different moments in the workflow.

---

## Implementation Plan

### Step 1: Extend `CascadeColumnMode` (model.ts)

Add `'create'` to the union type:
```typescript
export type CascadeColumnMode = 'view' | 'edit' | 'create';
```

One-line change. No downstream breakage — existing `if (entry.mode === 'edit')` / `if (entry.mode === 'view')` checks still work; `'create'` falls through to a new branch.

### Step 2: Extract `EntityCreateForm` component (chocolate-lab-ui)

Generic create form component parameterized for reuse across entity types:

```typescript
interface IEntityCreateFormProps<TEntity> {
  /** Convert name to slug ID */
  slugify: (name: string) => string;
  /** Build AI prompt from name */
  buildPrompt: (name: string) => string;
  /** Parse AI JSON into entity */
  parseJson: (from: unknown) => Result<{ entity: TEntity; notes?: string }>;
  /** Called with entity when user clicks Create or pastes valid JSON */
  onCreate: (entity: TEntity, source: 'manual' | 'ai') => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Build a blank entity from name + id */
  makeBlank: (name: string, id: string) => TEntity;
}
```

This lives in `chocolate-lab-ui/src/packlets/editing/` alongside `EditingToolbar` and `useEditingContext`.

### Step 3: Wire into `IngredientsTabContent` (App.tsx)

- **"+ New Ingredient"** pushes `{ entityType: 'ingredient', entityId: '__new__', mode: 'create' }`.
- In the cascade column builder, add a `mode === 'create'` branch that renders `EntityCreateForm` with ingredient-specific config.
- `onCreate` callback: runs existing `handleCreateIngredient` logic, then morphs the cascade entry to `mode: 'edit'`.
- Remove: `showNewDialog` state, `aiAssistActive` state, `promptCopied` state, the entire `<Modal>` block, and all associated state management.

### Step 4: Add drop target to list header

- Small icon button (🎯 target icon from heroicons — `CursorArrowRaysIcon` or similar) next to "+ New Ingredient".
- `onClick`: reads clipboard → parses → creates entity → pushes `mode: 'edit'` cascade entry.
- Error handling via toast messages.

### Step 5: Handle re-paste while editing

When the list header drop target is clicked while a cascade column is already open:
- Replace the cascade with the new ingredient in edit mode (same as selecting a different ingredient from the list).
- If the current column has unsaved changes, the existing unsaved-changes guard (future) would apply.

---

## What Stays the Same

- **ts-chocolate AI assist plumbing**: `buildIngredientAiPrompt`, `parseIngredientJson` — no changes needed.
- **`EditedIngredient` wrapper**: Works identically for blank and AI-populated entities.
- **`IngredientEditView`**: No changes — it receives a wrapper and renders the full editor.
- **`EditingToolbar`**: No changes.
- **`useEditingContext`**: No changes.
- **`handleCreateIngredient`** logic: Reused as-is (creates entity, adds to collection, creates wrapper).
- **`handleSave` / `handleCancelEdit`**: Reused as-is.

## What Changes

| File | Change |
|------|--------|
| `navigation/model.ts` | Add `'create'` to `CascadeColumnMode` |
| `editing/EntityCreateForm.tsx` (new) | Generic create form component |
| `editing/index.ts` | Export new component |
| `App.tsx` | Replace modal with cascade create + list drop target |

## Generalization Path

When we add editing for fillings, molds, etc., each entity type provides:
1. A `buildPrompt` function (or `undefined` if AI assist isn't supported for that type)
2. A `parseJson` function
3. A `makeBlank` function
4. An entity-specific `EditView` component

The `EntityCreateForm` + cascade `'create'` mode + list drop target pattern is reusable across all of them.
