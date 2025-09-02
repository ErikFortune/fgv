# Add Resource Feature Implementation Plan for ResolutionView

## Overview
Add the ability to create new resources directly within ResolutionView, with support for typed resources and host-controlled resource type selection. **Newly created resources will be held as pending resources and only applied when the user explicitly presses the Apply button.**

## Phase 1: Extend Resource Type System
1. **Modify ResourceType in ts-res library**
   - Add `createTemplate(resourceId: ResourceId): ResourceDecl` method to ResourceType interface
   - Implement default templates for built-in resource types
   - Support for custom templates via factory pattern

2. **Template Structure**
   - Templates should provide default candidate structure based on resource type
   - Include type-specific default values and metadata
   - Support qualifier-based variations in templates

## Phase 2: Pending Resources Management
1. **Extend ResolutionState for Pending Resources**
   ```typescript
   interface ResolutionState {
     // ... existing fields
     pendingResources: Map<string, ResourceDecl>; // Resources waiting to be applied
     pendingResourceDeletions: Set<string>; // IDs of resources to delete
     newResourceDraft?: {
       resourceId: string;
       resourceType: string;
       template: ResourceDecl;
       isValid: boolean;
     };
     availableResourceTypes: ResourceTypeInfo[];
     hasPendingResourceChanges: boolean; // True if there are pending adds/deletes
   }
   ```

2. **Extend ResolutionActions for Pending Operations**
   ```typescript
   interface ResolutionActions {
     // ... existing actions
     // Resource creation
     startNewResource: () => void;
     updateNewResourceId: (id: string) => void;
     selectResourceType: (type: string) => void;
     saveNewResourceAsPending: () => void; // Adds to pending, not applied
     cancelNewResource: () => void;
     
     // Pending resource management
     removePendingResource: (resourceId: string) => void;
     markResourceForDeletion: (resourceId: string) => void;
     applyPendingResources: () => void; // Apply all pending changes
     discardPendingResources: () => void; // Discard all pending changes
   }
   ```

## Phase 3: UI Components with Pending State
1. **Add Resource Button/Control**
   - Add "+" button in ResolutionView resource list header
   - Show modal/panel for resource creation workflow
   - Visual indicator for pending resources (e.g., dashed border, "pending" badge)

2. **Resource Creation Dialog**
   - Resource ID input field with validation
   - Resource type selector (dropdown/radio buttons)
   - Preview of template structure
   - Qualifier context for initial candidate creation
   - "Add as Pending" button (not "Save" directly)

3. **Pending Resources Indicator**
   - Show count of pending additions/deletions
   - List view of pending changes
   - Individual remove buttons for pending resources
   - Global Apply/Discard buttons

4. **Apply/Discard Controls**
   ```typescript
   // Similar to existing edit controls but for resources
   <PendingResourceControls
     pendingAddCount={state.pendingResources.size}
     pendingDeleteCount={state.pendingResourceDeletions.size}
     onApply={actions.applyPendingResources}
     onDiscard={actions.discardPendingResources}
     disabled={!state.hasPendingResourceChanges}
   />
   ```

## Phase 4: Three-Layer Resource State
Similar to the three-layer context system:
1. **Base Resources**: Original loaded resources
2. **Applied Resources**: Base + previously applied additions/deletions
3. **Pending Resources**: Not yet applied additions/deletions
4. **Effective Resources**: Applied + Pending (for preview/testing)

## Phase 5: Integration Points
1. **ResolutionView Props Extension**
   ```typescript
   interface ResolutionViewProps {
     // ... existing props
     allowResourceCreation?: boolean;
     defaultResourceType?: string;
     resourceTypeFactory?: ResourceTypeFactory;
     onPendingResourcesApplied?: (added: ResourceDecl[], deleted: string[]) => void;
     showPendingResourcesInList?: boolean; // Show with visual distinction
   }
   ```

2. **Visual Distinction for Resource States**
   - Normal resources: Standard appearance
   - Pending additions: Dashed border, "+" icon, lighter background
   - Pending deletions: Strikethrough, red tint, "×" icon
   - Modified resources: Edit icon (existing functionality)

## Phase 6: Workflow Examples

### User Workflow
1. User clicks "Add Resource" button
2. Fills in resource ID and selects type (or uses host default)
3. Configures initial template values
4. Clicks "Add as Pending" - resource appears in list with pending indicator
5. User can continue adding more resources or test resolution
6. User can remove individual pending resources
7. User clicks "Apply" to commit all pending resources
8. System rebuilds with new resources included

### Host-Controlled Workflow
```typescript
// Host provides default type, user can't change it
<ResolutionView
  allowResourceCreation={true}
  defaultResourceType="market-info" // Type selector hidden
  onPendingResourcesApplied={(added, deleted) => {
    // Host handles the actual application
    added.forEach(resource => {
      orchestrator.addResource(resource);
    });
    deleted.forEach(id => {
      orchestrator.removeResource(id);
    });
  }}
/>
```

## Phase 7: State Management Details
1. **Pending Resources Display**
   ```typescript
   // In ResourcePicker, merge pending resources for display
   const displayResources = useMemo(() => {
     const merged = { ...activeResources };
     // Add pending resources with special annotation
     state.pendingResources.forEach((resource, id) => {
       merged[id] = { ...resource, isPending: true };
     });
     // Mark deletions
     state.pendingResourceDeletions.forEach(id => {
       if (merged[id]) {
         merged[id].isPendingDeletion = true;
       }
     });
     return merged;
   }, [activeResources, state.pendingResources, state.pendingResourceDeletions]);
   ```

2. **Resolution Testing with Pending Resources**
   - Allow resolution testing against pending resources
   - Show warning that changes aren't applied yet
   - Preview mode shows expected results after apply

## Phase 8: Implementation Order
1. **Backend First**
   - Extend ResourceType with template support
   - Add pending resources state to useResolutionState
   - Implement merge logic for pending resources

2. **State Management**
   - Add pending resource actions
   - Track pending additions and deletions
   - Implement apply/discard logic

3. **UI Components**
   - Build creation dialog with "Add as Pending"
   - Add pending resource indicators
   - Implement apply/discard controls

4. **Integration**
   - Wire up with existing resolution flow
   - Test preview with pending resources
   - Ensure proper state cleanup

## Technical Considerations
- **State Consistency**: Pending resources shouldn't affect base state until applied
- **Validation**: Validate pending resources don't conflict with each other
- **Preview**: Allow testing resolution with pending resources included
- **Rollback**: Easy discard of all pending changes
- **Visual Clarity**: Clear distinction between applied and pending resources

## API Example with Pending Resources
```typescript
// Component using pending resources
function MyResolutionTool() {
  const { state, actions } = useResolutionState();
  
  return (
    <ResolutionView
      allowResourceCreation={true}
      resources={state.resources}
      pendingResources={state.pendingResources}
      onPendingResourcesApplied={(added, deleted) => {
        // Batch apply all pending changes
        const result = actions.applyResourceChanges(added, deleted);
        if (result.isSuccess()) {
          actions.addMessage('success', `Applied ${added.length} additions, ${deleted.length} deletions`);
        }
      }}
    />
  );
}
```

This plan ensures that newly created resources follow the same pending/applied pattern as the context values, maintaining consistency in the UI and giving users full control over when changes are actually applied to the system.