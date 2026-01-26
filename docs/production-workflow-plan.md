# Production Workflow Implementation Plan

## Overview
This document tracks the implementation of the comprehensive production workflow for confections and fillings in the chocolate-lab web application. The workflow enables creating new recipe versions when editing confections in the Production view, moving beyond journal-only commits.

## Current Status: Phase 1 Complete ✅

### Completed Work

#### 1. Draft Version Snapshot Architecture ✅
- **Goal**: Replace per-field draft overrides with full `AnyConfectionVersion` snapshot
- **Implementation**:
  - Extended `IPersistedConfectionSessionDraft` to include `draftVersion?: AnyConfectionVersion`
  - Bumped scratchpad schema version to `2`
  - Updated converters for serialization/deserialization
  - Modified `ProductionView.tsx` to read/edit/commit against `draftVersion`
  - All UI selectors now modify `draftVersion` immutably

#### 2. Commit Logic & Version Creation ✅
- **Goal**: Create new confection versions when recipe changes are detected
- **Implementation**:
  - Commit detects `recipeChanged` by comparing `draftVersion` to base version
  - When `recipeChanged = true`: creates new version with timestamp-based `versionSpec`
  - When `recipeChanged = false`: journal-only commit
  - Sets `goldenVersionSpec` to new version so it displays by default
  - Properly handles immutable-to-mutable forking (read-only → private collection)

#### 3. Observability & Error Handling ✅
- **Goal**: Surface commit process information to users
- **Implementation**:
  - Integrated `useObservability` (`user` and `diag` loggers)
  - Success messages show whether version was created or journal-only
  - Errors surface in MessagesPane UI
  - Removed all `console.log` statements in favor of `LogReporter`

#### 4. UI Refresh & Cache Management ✅
- **Goal**: Ensure newly committed confections appear immediately in Browse view
- **Implementation**:
  - Fixed `RuntimeContext._resolveRuntimeConfections()` to synchronize cache with library
  - `notifyLibraryChanged()` clears cache and triggers UI refresh
  - Browse view now shows new confections immediately after commit
  - Detail view displays correct version with edits

#### 5. Draft State Stability ✅
- **Goal**: Prevent flaky draft change detection
- **Implementation**:
  - Updated `isJsonEqual` to normalize objects by recursively sorting keys
  - Ensures stable JSON comparisons regardless of key order
  - Prevents false positives in draft change detection

#### 6. Local Storage Persistence ✅
- **Goal**: Confection collections persist across app restarts
- **Implementation**:
  - Added `LOCAL_CONFECTION_COLLECTIONS_KEY` to `ChocolateContext.tsx`
  - Implemented `readLocalConfectionCollectionFiles()` (same pattern as fillings)
  - Included confection collections in `localFiles` array during library load
  - Confection collections now persist like other collection types

#### 7. Session State Management ✅
- **Goal**: Fix commit button staying disabled
- **Implementation**:
  - Relaxed button disabling logic
  - Commit/Abandon only disabled when `status === 'committed'` or `status === 'abandoned'`
  - Sessions in intermediate states (e.g., 'committing') can now be committed

#### 8. Recipe Editing UI ✅
- **Goal**: Enable actual recipe changes (not just selecting from alternatives)
- **Implementation**:
  - Added **"+ Add Filling Slot"** button: creates new filling slots with unique IDs
  - Added **"+ Add Procedure Option"** button: adds new procedure options to list
  - Both actions create `draftVersion` snapshots immediately
  - These count as recipe changes and trigger version creation on commit

## Key Technical Concepts

### Data Models
- **`draftVersion`**: Full `AnyConfectionVersion` snapshot stored in scratchpad
- **`IPersistedConfectionSessionDraft`**: Scratchpad storage format (schema v2)
- **`ConfectionId` format**: `sourceId.baseConfectionId` (e.g., `user.dark-dome-bonbon`)
- **`ConfectionVersionId` format**: `confectionId@versionSpec` (e.g., `user.dark-dome-bonbon@2026-01-03-01`)

### Storage Keys
- Scratchpad: `chocolate-lab-web:scratchpad:sessions:v2`
- Confection collections: `chocolate-lab-web:confections:collections:v1`
- Filling collections: `chocolate-lab-web:fillings:collections:v1`
- Other collections follow same pattern

### Workflow Rules
- **Production edits order**: shell → fillings → procedure
- **Yield changes**: Journal-only (recipe yield corrections belong in basic edit view)
- **Recipe changes**: Create new version when `draftVersion` differs from base
- **Journal-only commits**: When no recipe changes but production data recorded

## Testing Workflow

### Basic Smoke Test
1. Create a new confection collection, star it
2. Restart the app → Confirm collection persists ✅
3. Start a production session on any confection
4. Click **"+ Add Filling Slot"** or **"+ Add Procedure Option"**
5. Commit the session
6. Verify:
   - New confection version created
   - Version appears in Browse view
   - Detail view shows edits
   - Messages appear in MessagesPane

### Edge Cases Tested
- ✅ Committing from read-only to private collection
- ✅ Browse view refresh after commit
- ✅ Golden version update for Detail view
- ✅ Draft equality with different key orders
- ✅ Confection collection persistence across restarts
- ✅ Session state management with intermediate states

## Next Phase: Advanced Editing

### Planned Features
1. **Enhanced Filling Slot Editing**
   - Edit slot names
   - Edit quantities
   - Add notes to slots
   - Remove slots
   - Reorder slots

2. **Enhanced Procedure Editing**
   - Add notes to procedure options
   - Remove procedure options
   - Reorder procedure options

3. **Shell Chocolate Expansion**
   - Add new chocolate options to allowed list
   - Remove chocolate options

4. **Validation & Constraints**
   - Prevent invalid slot configurations
   - Validate procedure option uniqueness
   - Ensure at least one filling slot exists

5. **UI/UX Improvements**
   - Inline editing for slot names
   - Drag-and-drop reordering
   - Better visual feedback for draft changes
   - Undo/redo for draft edits

## Known Issues & Limitations

### Current Limitations
- Cannot edit slot quantities or notes yet (only selection)
- Cannot remove slots or procedure options
- Cannot reorder slots or procedures
- Commit button intermittently disabled (needs further investigation)

### Technical Debt
- Some type assertions use `as unknown as` for cross-boundary types
- Bundle size warnings (1.45 MiB, recommended 244 KiB)
- TypeScript 5.9.3 newer than Heft/API Extractor tested versions

## File Modifications Summary

### Core Model Changes
- `libraries/ts-chocolate/src/packlets/runtime/scratchpad/model.ts`
- `libraries/ts-chocolate/src/packlets/runtime/scratchpad/converters.ts`
- `libraries/ts-chocolate/src/packlets/runtime/runtimeContext.ts`

### UI & Context Changes
- `apps/chocolate-lab-web/src/contexts/SessionScratchpadContext.tsx`
- `apps/chocolate-lab-web/src/contexts/ChocolateContext.tsx`
- `apps/chocolate-lab-web/src/contexts/EditingContext.tsx`
- `apps/chocolate-lab-web/src/tools/confections/views/ProductionView.tsx`

### Related Files
- `apps/chocolate-lab-web/src/tools/confections/views/BrowseView.tsx`
- `apps/chocolate-lab-web/src/tools/confections/views/DetailView.tsx`

## Build & Development

### Build Commands
```bash
# Full monorepo build
node common/scripts/install-run-rush.js build

# Build up to web app
node common/scripts/install-run-rush.js build --to chocolate-lab-web

# Rebuild specific package
node common/scripts/install-run-rush.js rebuild --to ts-chocolate
```

### Monorepo Structure
- **Rush**: Monorepo management (v5.162.0)
- **PNPM**: Package manager (v8.15.9)
- **Heft**: Build system for libraries
- **Webpack**: Bundler for web app

## References

### Key Documentation
- Production workflow user guidance: Shell → Fillings → Procedure order
- Observability: Use `LogReporter` (propagate logger, no console.log)
- Shell chocolate model: `IChocolateSpec = IIdsWithPreferred<IngredientId>`

### Related Systems
- Journal management: `IConfectionJournalRecord`, `IConfectionJournalEntry`
- Collection management: `CollectionManager`, sublibrary CRUD operations
- Runtime context: Caching, reverse lookups, library integration

---

**Last Updated**: January 26, 2026
**Status**: Phase 1 Complete, Ready for Phase 2 Planning
