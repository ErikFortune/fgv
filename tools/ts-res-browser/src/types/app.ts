// Application state types
export interface Message {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

export type Tool = 'import' | 'source' | 'compiled' | 'resolution';

export interface AppState {
  selectedTool: Tool;
  messages: Message[];
}

export interface AppActions {
  setSelectedTool: (tool: Tool) => void;
  addMessage: (type: Message['type'], message: string) => void;
  clearMessages: () => void;
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
