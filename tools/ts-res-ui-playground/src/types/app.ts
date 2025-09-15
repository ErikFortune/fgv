// Application state types
import { ViewStateTools } from '@fgv/ts-res-ui-components';

export type Message = ViewStateTools.Message;

export type Tool =
  | 'import'
  | 'source'
  | 'filter'
  | 'compiled'
  | 'resolution'
  | 'configuration'
  | 'picker'
  | 'grid'
  | 'multi-grid'
  | 'host-resolution'
  | 'resource-creation';

export interface FilterState {
  enabled: boolean;
  values: Record<string, string | undefined>;
  appliedValues: Record<string, string | undefined>;
  hasPendingChanges: boolean;
  reduceQualifiers: boolean;
}

export interface AppState {
  selectedTool: Tool;
  messages: Message[];
  filterState: FilterState;
}

export interface AppActions {
  setSelectedTool: (tool: Tool, force?: boolean) => void;
  setActiveTool: (tool: Tool, force?: boolean) => void; // Alias for setSelectedTool
  addMessage: (type: Message['type'], message: string) => void;
  clearMessages: () => void;
  updateFilterEnabled: (enabled: boolean) => void;
  updateFilterValues: (values: Record<string, string | undefined>) => void;
  applyFilterValues: () => void;
  resetFilterValues: () => void;
  updateReduceQualifiers: (reduceQualifiers: boolean) => void;
}

// Tool-specific types
export interface SourceBrowserState {
  selectedResource: string | null;
  resources: any[]; // Will be typed with ts-res types
}

export interface CompiledBrowserState {
  selectedResource: string | null;
  compiledResources: any[]; // Will be typed with ts-res types
}

export interface ResolutionViewerState {
  selectedResource: string | null;
  qualifiers: Record<string, any>;
  candidates: any[]; // Will be typed with ts-res types
  viewMode: 'best' | 'all';
}

// File import types
export interface FileImportOptions {
  types: Array<{
    description: string;
    accept: Record<string, string[]>;
  }>;
  multiple: boolean;
  excludeAcceptAllOption: boolean;
}
