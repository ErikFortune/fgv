# ResourcePicker Configuration Example

This document demonstrates how to properly configure the ResourcePicker after the recent refactoring to eliminate the duplicate `IResourcePickerOptions` interfaces.

## Overview

There are now two distinct configuration mechanisms:

1. **`pickerOptions`** - Controls the actual behavior of the ResourcePicker (rootPath, defaultView, etc.)
2. **`pickerOptionsPresentation`** - Controls whether/how the picker options control panel UI is displayed

## Example Usage

### Basic Configuration

```tsx
import { ResolutionView } from '@fgv/ts-res-ui-components';
import type { IResourcePickerOptions } from '@fgv/ts-res-ui-components';

function MyResourceManager() {
  // Configure picker behavior programmatically
  const pickerOptions: IResourcePickerOptions = {
    defaultView: 'tree',
    rootPath: 'user.messages',  // Focus on a specific branch
    hideRootNode: true,         // Hide the 'user.messages' node itself
    enableSearch: true,
    searchPlaceholder: 'Search user messages...',
    height: '600px'
  };

  return (
    <ResolutionView
      resources={processedResources}
      resolutionState={resolutionState}
      resolutionActions={resolutionActions}

      // Set picker behavior programmatically
      pickerOptions={pickerOptions}

      // Hide the options control panel in production
      pickerOptionsPresentation="hidden"
    />
  );
}
```

### Development vs Production

```tsx
function MyApp() {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <ResolutionView
      resources={processedResources}
      resolutionState={resolutionState}
      resolutionActions={resolutionActions}

      // Configure picker behavior
      pickerOptions={{
        defaultView: 'tree',
        rootPath: 'platform.territories',
        hideRootNode: false,
        enableSearch: true
      }}

      // Show options control panel only in development
      pickerOptionsPresentation={isDevelopment ? 'collapsible' : 'hidden'}
    />
  );
}
```

### Multiple Views with Different Configurations

```tsx
function MultiViewApp() {
  return (
    <div>
      {/* Source view - show all resources in list */}
      <SourceView
        resources={resources}
        pickerOptions={{
          defaultView: 'list',
          enableSearch: true,
          height: '400px'
        }}
        pickerOptionsPresentation="hidden"
      />

      {/* Resolution view - focus on user resources in tree */}
      <ResolutionView
        resources={resources}
        resolutionState={resolutionState}
        resolutionActions={resolutionActions}
        pickerOptions={{
          defaultView: 'tree',
          rootPath: 'user',
          hideRootNode: true,
          height: '500px'
        }}
        pickerOptionsPresentation="hidden"
      />

      {/* Filter view - show app resources */}
      <FilterView
        resources={resources}
        filterState={filterState}
        filterActions={filterActions}
        pickerOptions={{
          defaultView: 'tree',
          rootPath: 'app',
          hideRootNode: false
        }}
        pickerOptionsPresentation="hidden"
      />
    </div>
  );
}
```

## pickerOptionsPresentation Values

- **`'hidden'`** - (Default) No options control panel shown
- **`'inline'`** - Always expanded control panel
- **`'collapsible'`** - Expandable/collapsible control panel
- **`'popup'`** - Full modal dialog for options
- **`'popover'`** - Small dropdown overlay for options

## IResourcePickerOptions Properties

```typescript
interface IResourcePickerOptions {
  // View and navigation
  defaultView?: 'list' | 'tree';
  showViewToggle?: boolean;

  // Branch isolation
  rootPath?: string;           // e.g., "platform.territories"
  hideRootNode?: boolean;

  // Search
  enableSearch?: boolean;
  searchPlaceholder?: string;
  searchScope?: 'all' | 'current-branch';

  // Appearance
  emptyMessage?: string;
  height?: string | number;
}
```

## Migration from Previous Version

If you were using the old structure where `IResourcePickerOptions` in `types/index.ts` had presentation settings, you'll need to update:

### Before
```tsx
// This no longer works - IResourcePickerOptions was renamed
<ResolutionView
  pickerOptions={{
    presentation: 'collapsible',  // This was moved
    className: 'my-picker'        // This was removed
  }}
/>
```

### After
```tsx
// Separate concerns properly
<ResolutionView
  pickerOptions={{
    defaultView: 'tree',
    rootPath: 'user.messages'
    // ... other picker behavior options
  }}
  pickerOptionsPresentation="collapsible"
/>
```