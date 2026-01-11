/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

/**
 * Tool identifiers for top-level navigation
 */
export type ToolId = 'ingredients' | 'recipes' | 'procedures' | 'molds' | 'confections' | 'settings';

/**
 * Tool definition for navigation
 */
export interface ITool {
  /** Tool identifier */
  id: ToolId;
  /** Display name */
  name: string;
  /** Optional icon name (from heroicons) */
  icon?: string;
  /** Whether this tool is enabled */
  enabled: boolean;
}

/**
 * Available tools configuration
 */
export const TOOLS: ITool[] = [
  { id: 'ingredients', name: 'Ingredients', enabled: true },
  { id: 'recipes', name: 'Recipes', enabled: true },
  { id: 'procedures', name: 'Procedures', enabled: true },
  { id: 'molds', name: 'Molds', enabled: true },
  { id: 'confections', name: 'Confections', enabled: true },
  { id: 'settings', name: 'Settings', enabled: true }
];

/**
 * Get tool by ID
 */
export function getToolById(id: ToolId): ITool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}
