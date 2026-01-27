/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ObservabilityProvider } from '@fgv/ts-chocolate-ui';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SecretsProvider } from './contexts/SecretsContext';
import { RuntimeProvider } from './contexts/RuntimeContext';
import { CollectionsProvider } from './contexts/CollectionsContext';
import { LibraryImportProvider } from './contexts/LibraryImportContext';
import { EditingProvider } from './contexts/EditingContext';
import { SessionScratchpadProvider } from './contexts/SessionScratchpadContext';
import { AppShell } from './components/layout';
import type { ToolId } from './types/navigation';

// Tool components
import { IngredientsToolSidebar, type IIngredientFilters } from './tools/ingredients';
import { BrowseView } from './tools/ingredients/views/BrowseView';
import { EditableDetailView } from './tools/ingredients/views/EditableDetailView';
import { FillingsTool, FillingsToolSidebar, type IFillingFilters } from './tools/fillings';
import { TasksTool } from './tools/tasks/TasksTool';
import { TasksToolSidebar, type ITaskFilters } from './tools/tasks/TasksToolSidebar';
import { ProceduresTool, ProceduresToolSidebar, type IProcedureFilters } from './tools/procedures';
import { MoldsTool, MoldsToolSidebar, type IMoldFilters } from './tools/molds';
import { ConfectionsTool, ConfectionsToolSidebar, type IConfectionFilters } from './tools/confections';
import { SettingsTool } from './tools/settings/SettingsTool';
import type { IngredientId } from '@fgv/ts-chocolate';

/**
 * Main application component with tool routing
 */
function AppContent(): React.ReactElement {
  const [activeTool, setActiveTool] = useState<ToolId>('fillings');

  useEffect(() => {
    const applyHashNavigation = (): void => {
      const hash = window.location.hash;
      if (hash === '#procedures' || hash.startsWith('#procedures/')) {
        setActiveTool('procedures');
      }
      if (hash === '#fillings' || hash.startsWith('#fillings/')) {
        setActiveTool('fillings');
      }
      if (hash === '#confections' || hash.startsWith('#confections/')) {
        setActiveTool('confections');
      }
    };

    applyHashNavigation();
    window.addEventListener('hashchange', applyHashNavigation);
    return () => window.removeEventListener('hashchange', applyHashNavigation);
  }, []);

  // Ingredient filters state (lifted here for sidebar sync)
  const [ingredientFilters, setIngredientFilters] = useState<IIngredientFilters>({
    search: '',
    categories: [],
    collections: [],
    tags: []
  });

  // Filling filters state (lifted here for sidebar sync)
  const [fillingFilters, setFillingFilters] = useState<IFillingFilters>({
    search: '',
    categories: [],
    collections: [],
    tags: []
  });

  const [moldFilters, setMoldFilters] = useState<IMoldFilters>({
    search: '',
    collections: [],
    tags: [],
    formats: [],
    cavityCountMin: null,
    cavityCountMax: null,
    cavityWeightMin: null,
    cavityWeightMax: null
  });

  const [taskFilters, setTaskFilters] = useState<ITaskFilters>({
    search: '',
    collections: [],
    tags: []
  });

  const [procedureFilters, setProcedureFilters] = useState<IProcedureFilters>({
    search: '',
    collections: [],
    tags: []
  });

  const [confectionFilters, setConfectionFilters] = useState<IConfectionFilters>({
    search: '',
    confectionTypes: [],
    collections: [],
    tags: []
  });

  // Render the active tool's sidebar
  const sidebar = useMemo(() => {
    switch (activeTool) {
      case 'ingredients':
        return <IngredientsToolSidebar filters={ingredientFilters} onFiltersChange={setIngredientFilters} />;
      case 'fillings':
        return <FillingsToolSidebar filters={fillingFilters} onFiltersChange={setFillingFilters} />;
      case 'tasks':
        return <TasksToolSidebar filters={taskFilters} onFiltersChange={setTaskFilters} />;
      case 'procedures':
        return <ProceduresToolSidebar filters={procedureFilters} onFiltersChange={setProcedureFilters} />;
      case 'molds':
        return <MoldsToolSidebar filters={moldFilters} onFiltersChange={setMoldFilters} />;
      case 'confections':
        return <ConfectionsToolSidebar filters={confectionFilters} onFiltersChange={setConfectionFilters} />;
      default:
        return null;
    }
  }, [
    activeTool,
    ingredientFilters,
    fillingFilters,
    moldFilters,
    procedureFilters,
    taskFilters,
    confectionFilters
  ]);

  // Render the active tool content
  const content = useMemo(() => {
    switch (activeTool) {
      case 'ingredients':
        return <IngredientsToolContent filters={ingredientFilters} />;
      case 'fillings':
        return <FillingsTool filters={fillingFilters} />;
      case 'tasks':
        return <TasksTool filters={taskFilters} />;
      case 'procedures':
        return <ProceduresTool filters={procedureFilters} />;
      case 'molds':
        return <MoldsTool filters={moldFilters} />;
      case 'confections':
        return <ConfectionsTool filters={confectionFilters} />;
      case 'settings':
        return <SettingsTool />;
      default:
        return null;
    }
  }, [
    activeTool,
    ingredientFilters,
    fillingFilters,
    moldFilters,
    procedureFilters,
    taskFilters,
    confectionFilters
  ]);

  return (
    <AppShell activeTool={activeTool} onToolChange={setActiveTool} sidebar={sidebar}>
      {content}
    </AppShell>
  );
}

/**
 * Ingredients tool content with filter state
 */
function IngredientsToolContent({ filters }: { filters: IIngredientFilters }): React.ReactElement {
  const [selectedId, setSelectedId] = useState<IngredientId | null>(null);
  const [viewMode, setViewMode] = useState<'browse' | 'detail'>('browse');

  const handleSelect = (id: string): void => {
    setSelectedId(id as IngredientId);
    setViewMode('detail');
  };

  const handleBack = (): void => {
    setViewMode('browse');
    setSelectedId(null);
  };

  if (viewMode === 'detail' && selectedId) {
    return <EditableDetailView ingredientId={selectedId} onBack={handleBack} />;
  }

  return <BrowseView filters={filters} selectedId={selectedId} onSelect={handleSelect} />;
}

/**
 * Root application with providers
 */
function App(): React.ReactElement {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <SecretsProvider>
          <ObservabilityProvider>
            <RuntimeProvider>
              <CollectionsProvider>
                <LibraryImportProvider>
                  <EditingProvider>
                    <SessionScratchpadProvider>
                      <AppContent />
                    </SessionScratchpadProvider>
                  </EditingProvider>
                </LibraryImportProvider>
              </CollectionsProvider>
            </RuntimeProvider>
          </ObservabilityProvider>
        </SecretsProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
