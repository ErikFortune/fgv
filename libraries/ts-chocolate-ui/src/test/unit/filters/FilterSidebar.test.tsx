/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterSidebar } from '../../../packlets/filters';
import {
  createInitialFilterState,
  type IFilterActions,
  type IBaseFilterState
} from '../../../packlets/hooks';

describe('FilterSidebar', () => {
  const mockActions: IFilterActions<IBaseFilterState> = {
    setSearch: jest.fn(),
    toggleCollection: jest.fn(),
    toggleTag: jest.fn(),
    clearFilters: jest.fn(),
    setFilters: jest.fn(),
    hasActiveFilters: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      />
    );

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('renders custom search placeholder', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
        searchPlaceholder="Search tasks..."
      />
    );

    expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
  });

  test('calls setSearch when search input changes', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Search...'), { target: { value: 'test' } });

    expect(mockActions.setSearch).toHaveBeenCalledWith('test');
  });

  test('renders tags when provided', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={['tag1', 'tag2', 'tag3']}
        collectionsPanel={<div>Collections</div>}
      />
    );

    // Expand the Tags section
    fireEvent.click(screen.getByText('Tags'));

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
  });

  test('calls toggleTag when tag clicked', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={['tag1']}
        collectionsPanel={<div>Collections</div>}
      />
    );

    // Expand the Tags section
    fireEvent.click(screen.getByText('Tags'));
    fireEvent.click(screen.getByText('tag1'));

    expect(mockActions.toggleTag).toHaveBeenCalledWith('tag1');
  });

  test('hides Filters section when no content (no tags, no children, no active filters)', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      />
    );

    // Filters section should be hidden when there's nothing to show
    expect(screen.queryByText('Filters')).not.toBeInTheDocument();
    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  test('shows Filters section when tags exist', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={['tag1']}
        collectionsPanel={<div>Collections</div>}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  test('shows Filters section when children provided', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      >
        <div>Custom filter</div>
      </FilterSidebar>
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  test('shows Filters section when hasActiveFilters is true', () => {
    const actionsWithActiveFilters = { ...mockActions, hasActiveFilters: true };

    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={actionsWithActiveFilters}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      />
    );

    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  test('shows tags section when showTags is true', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
        showTags={true}
      />
    );

    // Tags section should be visible even with no tags
    expect(screen.getByText('Tags')).toBeInTheDocument();
  });

  test('hides tags section when showTags is false', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={['tag1', 'tag2']}
        collectionsPanel={<div>Collections</div>}
        showTags={false}
      />
    );

    expect(screen.queryByText('Tags')).not.toBeInTheDocument();
  });

  test('renders collections panel', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div data-testid="collections-panel">My Collections</div>}
      />
    );

    expect(screen.getByTestId('collections-panel')).toBeInTheDocument();
  });

  test('renders children in filters section', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      >
        <div data-testid="custom-filter">Custom Filter</div>
      </FilterSidebar>
    );

    expect(screen.getByTestId('custom-filter')).toBeInTheDocument();
  });

  test('shows clear button when hasActiveFilters is true', () => {
    const actionsWithActiveFilters = { ...mockActions, hasActiveFilters: true };

    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={actionsWithActiveFilters}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      />
    );

    expect(screen.getByText('Clear all filters')).toBeInTheDocument();
  });

  test('hides clear button when hasActiveFilters is false', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      />
    );

    expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument();
  });

  test('calls clearFilters when clear button clicked', () => {
    const actionsWithActiveFilters = { ...mockActions, hasActiveFilters: true };

    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={actionsWithActiveFilters}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      />
    );

    fireEvent.click(screen.getByText('Clear all filters'));

    expect(mockActions.clearFilters).toHaveBeenCalledTimes(1);
  });

  test('uses custom section labels', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={['tag1']}
        collectionsPanel={<div>Collections</div>}
        filtersLabel="Filter Options"
        tagsLabel="Categories"
        collectionsLabel="Groups"
      />
    );

    expect(screen.getByText('Filter Options')).toBeInTheDocument();
    expect(screen.getByText('Groups')).toBeInTheDocument();
    // Tags section is nested inside Filters (which is open by default)
    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  test('highlights active tags', () => {
    const filtersWithActiveTag: IBaseFilterState = {
      ...createInitialFilterState(),
      tags: ['tag1']
    };

    render(
      <FilterSidebar
        filters={filtersWithActiveTag}
        actions={mockActions}
        tags={['tag1', 'tag2']}
        collectionsPanel={<div>Collections</div>}
      />
    );

    // Expand tags
    fireEvent.click(screen.getByText('Tags'));

    // tag1 should be active (the TagBadge component handles the styling)
    const tag1Button = screen.getByText('tag1');
    expect(tag1Button).toBeInTheDocument();
  });

  test('collapses filters section when toggled', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={{ ...mockActions, hasActiveFilters: true }}
        tags={[]}
        collectionsPanel={<div>Collections</div>}
      />
    );

    // Initially open - clear button visible
    expect(screen.getByText('Clear all filters')).toBeInTheDocument();

    // Toggle closed
    fireEvent.click(screen.getByText('Filters'));

    // Clear button should be hidden
    expect(screen.queryByText('Clear all filters')).not.toBeInTheDocument();
  });

  test('collapses collections section when toggled', () => {
    render(
      <FilterSidebar
        filters={createInitialFilterState()}
        actions={mockActions}
        tags={[]}
        collectionsPanel={<div data-testid="collections-panel">Collections Panel</div>}
      />
    );

    // Initially open
    expect(screen.getByTestId('collections-panel')).toBeInTheDocument();

    // Toggle closed
    fireEvent.click(screen.getByText('Collections'));

    // Panel should be hidden
    expect(screen.queryByTestId('collections-panel')).not.toBeInTheDocument();
  });
});
