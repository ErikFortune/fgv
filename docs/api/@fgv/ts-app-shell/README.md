[**@fgv Monorepo API Documentation**](../../README.md)

***

[@fgv Monorepo API Documentation](../../README.md) / @fgv/ts-app-shell

# @fgv/ts-app-shell

Shared React UI primitives for application shells in the `@fgv` monorepo.

> ⚠️ **Required setup** — this package ships its components as Tailwind-classed JSX. You
> must add the `@fgv/ts-app-shell` content path to your Tailwind config, or icons and
> overlays in the messages panel and other primitives will render unsized (invisible
> buttons, viewport-overflowing absolute overlays). See [Setup](#setup) below; the
> `MessagesProvider` self-diagnoses this configuration gap on mount and surfaces a
> warning message linking back here.

## Setup

See the [Theming](#theming) section for the canonical setup steps:

1. Add the Tailwind preset and include `./node_modules/@fgv/ts-app-shell/lib/**/*.{js,jsx}`
   in your `content` array.
2. Import `@fgv/ts-app-shell/theme.css` once in your application entry point.

## Troubleshooting

**Icons in the messages panel are invisible or oversized, or you see an
"@fgv/ts-app-shell styles are not fully loaded" warning message.** Your Tailwind config
is missing the `@fgv/ts-app-shell` content path. See [Setup](#setup) above and make sure
`./node_modules/@fgv/ts-app-shell/lib/**/*.{js,jsx}` appears in your `tailwind.config.js`
`content` array.

## Features

- **Column Cascade** — Master-detail drill-down with horizontal scrolling, breadcrumb navigation, and min-width columns
- **Compact Sidebar** — Filter rows with summary text and flyout selectors that overlay the main pane
- **Toast Notifications** — Ephemeral notifications with auto-dismiss and actionable links
- **Log Message Panel** — Collapsible bottom panel with severity-filtered message history
- **Command Palette** — Cmd+K quick navigation overlay
- **Keybinding Registry** — Infrastructure for registering and managing keyboard shortcuts
- **Default Theme** — CSS-variable tokens + Tailwind preset for all semantic colors (light + dark)

## Usage

```typescript
import { /* components */ } from '@fgv/ts-app-shell';
```

## Theming

All visual components use custom Tailwind semantic tokens (e.g. `bg-surface`, `text-primary`,
`bg-status-error-bg`). To make them render correctly in your application, add the Tailwind
preset and import the base CSS once.

### 1. Add the Tailwind preset

In your `tailwind.config.js` (or `tailwind.config.ts`):

```js
const appShellPreset = require('@fgv/ts-app-shell/tailwind-preset');

module.exports = {
  presets: [appShellPreset],
  // Make sure Tailwind scans the package's components for class names:
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@fgv/ts-app-shell/lib/**/*.{js,jsx}',
  ],
  // ...rest of your config
};
```

### 2. Import the base CSS

In your application entry point (e.g. `main.tsx` or `index.css`):

```ts
import '@fgv/ts-app-shell/theme.css';
```

### 3. Toggle dark mode

The preset uses Tailwind's `darkMode: 'class'` strategy. Add the class `dark` to any ancestor
element (typically `<html>`) to activate dark mode. The `ThemeProvider` component does this
automatically when the user selects `'dark'` or `'system'` (if the OS prefers dark):

```tsx
import { ThemeProvider } from '@fgv/ts-app-shell';

<ThemeProvider initialTheme="system" onThemeChange={saveTheme}>
  <App />
</ThemeProvider>
```

### Overriding tokens

Every token is a CSS custom property under the `--fgv-` prefix. Override any subset in your
own CSS after importing `theme.css`:

```css
:root {
  --fgv-brand-primary: #7c3aed;   /* purple brand instead of blue */
  --fgv-brand-accent: #a78bfa;
}
.dark {
  --fgv-brand-primary: #8b5cf6;
  --fgv-brand-accent: #c4b5fd;
}
```

## Complete Token Reference

### Surfaces

| Token name | CSS variable | Light default | Dark default | Purpose |
|---|---|---|---|---|
| `surface` | `--fgv-surface` | `#ffffff` | `#1f2937` | Base page / panel background |
| `surface-raised` | `--fgv-surface-raised` | `#f3f4f6` | `#374151` | Elevated cards, filter toolbars |
| `surface-alt` | `--fgv-surface-alt` | `#f9fafb` | `#111827` | Alternate / zebra row background |
| `backdrop` | `--fgv-backdrop` | `rgba(0,0,0,0.45)` | `rgba(0,0,0,0.65)` | Modal/dialog overlay |
| `hover` | `--fgv-hover` | `#f3f4f6` | `#374151` | Row hover highlight |
| `selected` | `--fgv-selected` | `#eff6ff` | `#1e3a5f` | Selected list item background |

### Text

| Token name | CSS variable | Light | Dark | Purpose |
|---|---|---|---|---|
| `primary` | `--fgv-text-primary` | `#111827` | `#f9fafb` | High-emphasis body text (WCAG AA+) |
| `secondary` | `--fgv-text-secondary` | `#374151` | `#d1d5db` | Medium-emphasis labels |
| `muted` | `--fgv-text-muted` | `#6b7280` | `#9ca3af` | Supporting / helper text |
| `faint` | `--fgv-text-faint` | `#9ca3af` | `#6b7280` | Ghost / ornamental text |
| `star` | `--fgv-text-star` | `#d97706` | `#fbbf24` | Star / favorite icon color |

### Borders & Focus

| Token name | CSS variable | Light | Dark | Purpose |
|---|---|---|---|---|
| `border` | `--fgv-border` | `#d1d5db` | `#4b5563` | Default input / divider border |
| `border-subtle` | `--fgv-border-subtle` | `#e5e7eb` | `#374151` | Subtle row separator |
| `focus-ring` | `--fgv-focus-ring` | `#3b82f6` | `#60a5fa` | Keyboard focus ring |
| `selected-border` | `--fgv-selected-border` | `#2563eb` | `#3b82f6` | Selected item left-border accent |

### Brand

| Token name | CSS variable | Light | Dark | Purpose |
|---|---|---|---|---|
| `brand-primary` | `--fgv-brand-primary` | `#2563eb` | `#3b82f6` | Primary action / active nav |
| `brand-secondary` | `--fgv-brand-secondary` | `#1d4ed8` | `#1e3a5f` | Pressed / dark top-bar variant |
| `brand-accent` | `--fgv-brand-accent` | `#3b82f6` | `#60a5fa` | Hover text, checkmarks, accents |

### Status: Error

| Token name | CSS variable | Purpose |
|---|---|---|
| `status-error-bg` | `--fgv-status-error-bg` | Error row / badge background |
| `status-error-surface` | `--fgv-status-error-surface` | Hover background on error items |
| `status-error-btn` | `--fgv-status-error-btn` | Danger action button fill |
| `status-error-btn-hover` | `--fgv-status-error-btn-hover` | Danger button hover fill |
| `status-error-icon` | `--fgv-status-error-icon` | Error icon / dot color |
| `status-error-border` | `--fgv-status-error-border` | Error section border |
| `status-error-accent` | `--fgv-status-error-accent` | Error focus ring |
| `status-error-text` | `--fgv-status-error-text` | Error message text |
| `status-error-strong` | `--fgv-status-error-strong` | High-emphasis error text |

### Status: Warning

| Token name | CSS variable | Purpose |
|---|---|---|
| `status-warning-bg` | `--fgv-status-warning-bg` | Warning row / badge background |
| `status-warning-surface` | `--fgv-status-warning-surface` | Hover background on warning items |
| `status-warning-btn` | `--fgv-status-warning-btn` | Warning action button fill |
| `status-warning-btn-hover` | `--fgv-status-warning-btn-hover` | Warning button hover fill |
| `status-warning-icon` | `--fgv-status-warning-icon` | Warning icon / dot color |
| `status-warning-border` | `--fgv-status-warning-border` | Warning section border |
| `status-warning-accent` | `--fgv-status-warning-accent` | Warning focus ring |
| `status-warning-text` | `--fgv-status-warning-text` | Warning message text |
| `status-warning-strong` | `--fgv-status-warning-strong` | High-emphasis warning text |

### Status: Info

| Token name | CSS variable | Purpose |
|---|---|---|
| `status-info-bg` | `--fgv-status-info-bg` | Info row / badge background |
| `status-info-surface` | `--fgv-status-info-surface` | Hover background on info items |
| `status-info-btn` | `--fgv-status-info-btn` | Info action button fill |
| `status-info-btn-hover` | `--fgv-status-info-btn-hover` | Info button hover fill |
| `status-info-icon` | `--fgv-status-info-icon` | Info icon / dot color |
| `status-info-border` | `--fgv-status-info-border` | Info section border |
| `status-info-accent` | `--fgv-status-info-accent` | Info focus ring |
| `status-info-text` | `--fgv-status-info-text` | Info message text |
| `status-info-strong` | `--fgv-status-info-strong` | High-emphasis info text |

### Status: Success

| Token name | CSS variable | Purpose |
|---|---|---|
| `status-success-bg` | `--fgv-status-success-bg` | Success row / badge background |
| `status-success-surface` | `--fgv-status-success-surface` | Hover background on success items |
| `status-success-btn` | `--fgv-status-success-btn` | Success action button fill |
| `status-success-btn-hover` | `--fgv-status-success-btn-hover` | Success button hover fill |
| `status-success-icon` | `--fgv-status-success-icon` | Success icon / dot color |
| `status-success-border` | `--fgv-status-success-border` | Success section border |
| `status-success-accent` | `--fgv-status-success-accent` | Success focus ring |
| `status-success-text` | `--fgv-status-success-text` | Success message text |
| `status-success-strong` | `--fgv-status-success-strong` | High-emphasis success text |

## Development

```bash
rushx build    # Build the library
rushx test     # Run tests
rushx coverage # Run tests with coverage
```

@fgv/ts-app-shell - Shared React UI primitives for application shells.

Provides reusable components for:
- Column cascade (master-detail drill-down)
- Compact sidebar with flyout filter selectors
- Toast notifications and log message panel
- Command palette
- Keybinding registry

## Classes

- [KeyboardShortcutRegistry](classes/KeyboardShortcutRegistry.md)
- [MessagesLogger](classes/MessagesLogger.md)

## Interfaces

- [IAiAssistAction](interfaces/IAiAssistAction.md)
- [IAiAssistResult](interfaces/IAiAssistResult.md)
- [ICascadeColumn](interfaces/ICascadeColumn.md)
- [ICascadeConflict](interfaces/ICascadeConflict.md)
- [ICascadeContainerProps](interfaces/ICascadeContainerProps.md)
- [ICascadeEntryBase](interfaces/ICascadeEntryBase.md)
- [ICascadeFind](interfaces/ICascadeFind.md)
- [ICascadeOps](interfaces/ICascadeOps.md)
- [ICheckboxInputProps](interfaces/ICheckboxInputProps.md)
- [ICollectionBadge](interfaces/ICollectionBadge.md)
- [ICollectionRowItem](interfaces/ICollectionRowItem.md)
- [ICollectionSectionProps](interfaces/ICollectionSectionProps.md)
- [IComparisonColumn](interfaces/IComparisonColumn.md)
- [IComparisonViewProps](interfaces/IComparisonViewProps.md)
- [IConfirmDialogProps](interfaces/IConfirmDialogProps.md)
- [ICreateMessageOptions](interfaces/ICreateMessageOptions.md)
- [IDetailHeaderProps](interfaces/IDetailHeaderProps.md)
- [IDetailRowProps](interfaces/IDetailRowProps.md)
- [IDetailSectionProps](interfaces/IDetailSectionProps.md)
- [IEditFieldProps](interfaces/IEditFieldProps.md)
- [IEditSectionProps](interfaces/IEditSectionProps.md)
- [IEmptyStateAction](interfaces/IEmptyStateAction.md)
- [IEmptyStateConfig](interfaces/IEmptyStateConfig.md)
- [IEntityDescriptor](interfaces/IEntityDescriptor.md)
- [IEntityGroupDescriptor](interfaces/IEntityGroupDescriptor.md)
- [IEntityListProps](interfaces/IEntityListProps.md)
- [IEntityRowProps](interfaces/IEntityRowProps.md)
- [IEntityStatus](interfaces/IEntityStatus.md)
- [IEntityTabLayoutProps](interfaces/IEntityTabLayoutProps.md)
- [IFilterBarProps](interfaces/IFilterBarProps.md)
- [IFilteredSuggestions](interfaces/IFilteredSuggestions.md)
- [IFilterOption](interfaces/IFilterOption.md)
- [IFilterRowProps](interfaces/IFilterRowProps.md)
- [IGroupedEntityListProps](interfaces/IGroupedEntityListProps.md)
- [IJsonDropZoneProps](interfaces/IJsonDropZoneProps.md)
- [IKeyBinding](interfaces/IKeyBinding.md)
- [IKeyboardShortcutProviderProps](interfaces/IKeyboardShortcutProviderProps.md)
- [IMessage](interfaces/IMessage.md)
- [IMessageCallbackAction](interfaces/IMessageCallbackAction.md)
- [IMessageHrefAction](interfaces/IMessageHrefAction.md)
- [IMessagesContextValue](interfaces/IMessagesContextValue.md)
- [IMessagesProviderProps](interfaces/IMessagesProviderProps.md)
- [IModalProps](interfaces/IModalProps.md)
- [IModeConfig](interfaces/IModeConfig.md)
- [IModeSelectorProps](interfaces/IModeSelectorProps.md)
- [IMultiActionButtonAction](interfaces/IMultiActionButtonAction.md)
- [IMultiActionButtonProps](interfaces/IMultiActionButtonProps.md)
- [INumberInputProps](interfaces/INumberInputProps.md)
- [INumericInputProps](interfaces/INumericInputProps.md)
- [IOptionalTextInputProps](interfaces/IOptionalTextInputProps.md)
- [IParsedHash](interfaces/IParsedHash.md)
- [IPreferredSelectorProps](interfaces/IPreferredSelectorProps.md)
- [IPrintEnclosureProps](interfaces/IPrintEnclosureProps.md)
- [IPrintWindowOptions](interfaces/IPrintWindowOptions.md)
- [IResponsiveLayout](interfaces/IResponsiveLayout.md)
- [IResponsiveProviderProps](interfaces/IResponsiveProviderProps.md)
- [ISearchBarProps](interfaces/ISearchBarProps.md)
- [ISelectableItem](interfaces/ISelectableItem.md)
- [ISelectInputProps](interfaces/ISelectInputProps.md)
- [IShortcut](interfaces/IShortcut.md)
- [IShortcutRegistration](interfaces/IShortcutRegistration.md)
- [ISidebarLayoutProps](interfaces/ISidebarLayoutProps.md)
- [IStatusBadgeProps](interfaces/IStatusBadgeProps.md)
- [IStatusBarProps](interfaces/IStatusBarProps.md)
- [ITabBadge](interfaces/ITabBadge.md)
- [ITabBarProps](interfaces/ITabBarProps.md)
- [ITabConfig](interfaces/ITabConfig.md)
- [ITagListProps](interfaces/ITagListProps.md)
- [ITagsInputProps](interfaces/ITagsInputProps.md)
- [ITextAreaInputProps](interfaces/ITextAreaInputProps.md)
- [ITextInputProps](interfaces/ITextInputProps.md)
- [IThemeContext](interfaces/IThemeContext.md)
- [IThemeOption](interfaces/IThemeOption.md)
- [IThemeProviderProps](interfaces/IThemeProviderProps.md)
- [IToastConfig](interfaces/IToastConfig.md)
- [IToastContainerProps](interfaces/IToastContainerProps.md)
- [IToastItemProps](interfaces/IToastItemProps.md)
- [ITypeaheadInputProps](interfaces/ITypeaheadInputProps.md)
- [ITypeaheadMatchResult](interfaces/ITypeaheadMatchResult.md)
- [ITypeaheadSuggestion](interfaces/ITypeaheadSuggestion.md)
- [IUrlSyncCallbacks](interfaces/IUrlSyncCallbacks.md)
- [IUrlSyncConfig](interfaces/IUrlSyncConfig.md)
- [IUrlSyncState](interfaces/IUrlSyncState.md)
- [IUseAiAssistParams](interfaces/IUseAiAssistParams.md)
- [IUseAiAssistResult](interfaces/IUseAiAssistResult.md)
- [IUseLogReporterOptions](interfaces/IUseLogReporterOptions.md)

## Type Aliases

- [CascadeColumnMode](type-aliases/CascadeColumnMode.md)
- [CascadeEntryOrigin](type-aliases/CascadeEntryOrigin.md)
- [CascadeEntrySpec](type-aliases/CascadeEntrySpec.md)
- [ConfirmDialogSeverity](type-aliases/ConfirmDialogSeverity.md)
- [DeviceType](type-aliases/DeviceType.md)
- [IMessageAction](type-aliases/IMessageAction.md)
- [LayoutMode](type-aliases/LayoutMode.md)
- [MessageSeverity](type-aliases/MessageSeverity.md)
- [ScreenOrientation](type-aliases/ScreenOrientation.md)
- [SourceColorMap](type-aliases/SourceColorMap.md)
- [ThemeId](type-aliases/ThemeId.md)

## Variables

- [CASCADE\_NEW\_ENTITY\_ID](variables/CASCADE_NEW_ENTITY_ID.md)
- [DEFAULT\_TOAST\_CONFIG](variables/DEFAULT_TOAST_CONFIG.md)
- [TAILWIND\_PROBE\_CLASS](variables/TAILWIND_PROBE_CLASS.md)
- [TAILWIND\_PROBE\_HEIGHT\_PX](variables/TAILWIND_PROBE_HEIGHT_PX.md)
- [TAILWIND\_PROBE\_MESSAGE\_TEXT](variables/TAILWIND_PROBE_MESSAGE_TEXT.md)
- [TAILWIND\_SETUP\_DOCS\_URL](variables/TAILWIND_SETUP_DOCS_URL.md)

## Functions

- [CascadeContainer](functions/CascadeContainer.md)
- [CheckboxInput](functions/CheckboxInput.md)
- [checkForAiErrorObject](functions/checkForAiErrorObject.md)
- [CollectionSection](functions/CollectionSection.md)
- [ComparisonView](functions/ComparisonView.md)
- [ConfirmDialog](functions/ConfirmDialog.md)
- [createMessage](functions/createMessage.md)
- [deriveSeverityFromLevel](functions/deriveSeverityFromLevel.md)
- [DetailHeader](functions/DetailHeader.md)
- [DetailRow](functions/DetailRow.md)
- [DetailSection](functions/DetailSection.md)
- [EditField](functions/EditField.md)
- [EditSection](functions/EditSection.md)
- [encodeUrlHash](functions/encodeUrlHash.md)
- [EntityList](functions/EntityList.md)
- [EntityRow](functions/EntityRow.md)
- [EntityTabLayout](functions/EntityTabLayout.md)
- [FilterBar](functions/FilterBar.md)
- [FilterRow](functions/FilterRow.md)
- [generateMessageId](functions/generateMessageId.md)
- [GroupedEntityList](functions/GroupedEntityList.md)
- [JsonDropZone](functions/JsonDropZone.md)
- [KeyboardShortcutProvider](functions/KeyboardShortcutProvider.md)
- [matchesBinding](functions/matchesBinding.md)
- [MessagesProvider](functions/MessagesProvider.md)
- [MobileCascadeStack](functions/MobileCascadeStack.md)
- [Modal](functions/Modal.md)
- [ModeSelector](functions/ModeSelector.md)
- [MultiActionButton](functions/MultiActionButton.md)
- [NumberInput](functions/NumberInput.md)
- [NumericInput](functions/NumericInput.md)
- [openPrintWindow](functions/openPrintWindow.md)
- [OptionalTextInput](functions/OptionalTextInput.md)
- [parseUrlHash](functions/parseUrlHash.md)
- [PreferredSelector](functions/PreferredSelector.md)
- [PrintEnclosure](functions/PrintEnclosure.md)
- [ResponsiveProvider](functions/ResponsiveProvider.md)
- [SearchBar](functions/SearchBar.md)
- [SelectInput](functions/SelectInput.md)
- [SidebarLayout](functions/SidebarLayout.md)
- [StatusBadge](functions/StatusBadge.md)
- [StatusBar](functions/StatusBar.md)
- [TabBar](functions/TabBar.md)
- [TagList](functions/TagList.md)
- [TagsInput](functions/TagsInput.md)
- [TextAreaInput](functions/TextAreaInput.md)
- [TextInput](functions/TextInput.md)
- [ThemeProvider](functions/ThemeProvider.md)
- [ToastContainer](functions/ToastContainer.md)
- [ToastItem](functions/ToastItem.md)
- [TypeaheadInput](functions/TypeaheadInput.md)
- [useAiAssist](functions/useAiAssist.md)
- [useCascadeDrillDown](functions/useCascadeDrillDown.md)
- [useCascadeOps](functions/useCascadeOps.md)
- [useKeyboardRegistry](functions/useKeyboardRegistry.md)
- [useKeyboardShortcuts](functions/useKeyboardShortcuts.md)
- [useLogReporter](functions/useLogReporter.md)
- [useMessages](functions/useMessages.md)
- [useResponsive](functions/useResponsive.md)
- [useResponsiveLayout](functions/useResponsiveLayout.md)
- [useSquashAt](functions/useSquashAt.md)
- [useTheme](functions/useTheme.md)
- [useTypeaheadMatch](functions/useTypeaheadMatch.md)
- [useUrlSync](functions/useUrlSync.md)
