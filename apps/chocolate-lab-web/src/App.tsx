/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import React, { useState, useMemo } from 'react';
import { ObservabilityProvider } from '@fgv/ts-chocolate-ui';
import { ThemeProvider } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ChocolateProvider } from './contexts/ChocolateContext';
import { AppShell } from './components/layout';
import type { ToolId } from './types/navigation';

// Tool components
import { IngredientsToolSidebar, type IIngredientFilters } from './tools/ingredients';
import { BrowseView } from './tools/ingredients/views/BrowseView';
import { DetailView } from './tools/ingredients/views/DetailView';
import { FillingsTool, FillingsToolSidebar, type IFillingFilters } from './tools/fillings';
import { ProceduresTool } from './tools/procedures';
import { MoldsTool } from './tools/molds/MoldsTool';
import { ConfectionsTool } from './tools/confections/ConfectionsTool';
import { SettingsTool } from './tools/settings/SettingsTool';
import type { IngredientId } from '@fgv/ts-chocolate';

/**
 * Main application component with tool routing
 */
function AppContent(): React.ReactElement {
  const [activeTool, setActiveTool] = useState<ToolId>('ingredients');

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

  // Render the active tool's sidebar
  const sidebar = useMemo(() => {
    switch (activeTool) {
      case 'ingredients':
        return <IngredientsToolSidebar filters={ingredientFilters} onFiltersChange={setIngredientFilters} />;
      case 'fillings':
        return <FillingsToolSidebar filters={fillingFilters} onFiltersChange={setFillingFilters} />;
      default:
        return null;
    }
  }, [activeTool, ingredientFilters, fillingFilters]);

  // Render the active tool content
  const content = useMemo(() => {
    switch (activeTool) {
      case 'ingredients':
        return <IngredientsToolContent filters={ingredientFilters} />;
      case 'fillings':
        return <FillingsTool filters={fillingFilters} />;
      case 'procedures':
        return <ProceduresTool />;
      case 'molds':
        return <MoldsTool />;
      case 'confections':
        return <ConfectionsTool />;
      case 'settings':
        return <SettingsTool />;
      default:
        return null;
    }
  }, [activeTool, ingredientFilters, fillingFilters]);

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
    return <DetailView ingredientId={selectedId} onBack={handleBack} />;
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
        <ObservabilityProvider>
          <ChocolateProvider>
            <AppContent />
          </ChocolateProvider>
        </ObservabilityProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
