[**@fgv Monorepo API Documentation**](../../README.md)

***

[@fgv Monorepo API Documentation](../../README.md) / @fgv/ts-app-shell

# @fgv/ts-app-shell

Shared React UI primitives for application shells in the `@fgv` monorepo.

## Features

- **Column Cascade** — Master-detail drill-down with horizontal scrolling, breadcrumb navigation, and min-width columns
- **Compact Sidebar** — Filter rows with summary text and flyout selectors that overlay the main pane
- **Toast Notifications** — Ephemeral notifications with auto-dismiss and actionable links
- **Log Message Panel** — Collapsible bottom panel with severity-filtered message history
- **Command Palette** — Cmd+K quick navigation overlay
- **Keybinding Registry** — Infrastructure for registering and managing keyboard shortcuts

## Usage

```typescript
import { /* components */ } from '@fgv/ts-app-shell';
```

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
- [IMessageAction](interfaces/IMessageAction.md)
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
- [LayoutMode](type-aliases/LayoutMode.md)
- [MessageSeverity](type-aliases/MessageSeverity.md)
- [ScreenOrientation](type-aliases/ScreenOrientation.md)
- [SourceColorMap](type-aliases/SourceColorMap.md)
- [ThemeId](type-aliases/ThemeId.md)

## Variables

- [CASCADE\_NEW\_ENTITY\_ID](variables/CASCADE_NEW_ENTITY_ID.md)
- [DEFAULT\_TOAST\_CONFIG](variables/DEFAULT_TOAST_CONFIG.md)

## Functions

- [CascadeContainer](functions/CascadeContainer.md)
- [CheckboxInput](functions/CheckboxInput.md)
- [checkForAiErrorObject](functions/checkForAiErrorObject.md)
- [CollectionSection](functions/CollectionSection.md)
- [ComparisonView](functions/ComparisonView.md)
- [ConfirmDialog](functions/ConfirmDialog.md)
- [createMessage](functions/createMessage.md)
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
