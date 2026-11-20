[Home](../README.md) > useResolutionState

# Function: useResolutionState

Hook for managing resource resolution state and editing operations.

This hook provides comprehensive state management for resource resolution,
including context management, resource editing, and conflict detection.
It integrates with the ts-res library to provide real-time resolution
results and supports editing resources with validation and preview functionality.

Key features:
- **Context Management**: Set and update resolution context (qualifiers)
- **Resource Resolution**: Real-time resolution with detailed results
- **Resource Editing**: Edit resources with validation and conflict detection
- **Preview Mode**: See how edits affect resolution without committing
- **Change Tracking**: Track pending changes and detect conflicts

## Signature

```typescript
function useResolutionState(processedResources: IProcessedResources | null, onSystemUpdate: (updatedResources: IProcessedResources) => void): IUseResolutionStateReturn
```
