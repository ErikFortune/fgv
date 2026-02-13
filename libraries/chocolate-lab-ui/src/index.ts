/**
 * @fgv/chocolate-lab-ui - Chocolate-specific React components for the Chocolate Lab application.
 *
 * Provides components for:
 * - Entity presentation and editing (ingredients, fillings, confections, molds, procedures, tasks)
 * - Variation management (selector, save dialog, change summary)
 * - Workspace reactivity (ReactiveWorkspace wrapper, useWorkspace hook)
 * - AI interactor slot for entity editors
 * - Production session management (session list, checklist, lifecycle)
 *
 * @packageDocumentation
 */

// Browser workspace initialization
export * from './packlets/workspace';

// Navigation store and types
export * from './packlets/navigation';
