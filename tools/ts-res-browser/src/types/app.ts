// Application state types
export interface AppState {
  selectedTool: 'source' | 'compiled' | 'resolution';
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export interface Message {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  text: string;
  timestamp: Date;
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
