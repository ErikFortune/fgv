/**
 * \@fgv/ts-app-shell - Shared React UI primitives for application shells.
 *
 * Provides reusable components for:
 * - Column cascade (master-detail drill-down)
 * - Compact sidebar with flyout filter selectors
 * - Toast notifications and log message panel
 * - Command palette
 * - Keybinding registry
 *
 * @packageDocumentation
 */

// Top bar components
export * from './packlets/top-bar';

// Messages infrastructure (context, toasts, status bar)
export * from './packlets/messages';

// URL hash synchronization for mode/tab navigation
export * from './packlets/url-sync';

// Modal dialog
export * from './packlets/modal';

// Keyboard shortcut registry
export * from './packlets/keyboard';

// Sidebar layout, search, filters, and entity list
export * from './packlets/sidebar';

// Column cascade container
export * from './packlets/cascade';

// Selectors (PreferredSelector popover)
export * from './packlets/selectors';

// JSON drop zone (generic drop/paste target with converter validation)
export * from './packlets/drop-zone';

// Generic edit field primitives for entity editors
export * from './packlets/editing';

// Generic detail-view primitive components
export * from './packlets/detail';
