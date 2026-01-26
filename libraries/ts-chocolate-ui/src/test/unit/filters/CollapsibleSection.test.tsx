/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSection } from '../../../packlets/filters';

describe('CollapsibleSection', () => {
  const mockOnToggle = jest.fn();

  beforeEach(() => {
    mockOnToggle.mockClear();
  });

  test('renders title', () => {
    render(
      <CollapsibleSection title="Test Section" isOpen={true} onToggle={mockOnToggle}>
        <div>Content</div>
      </CollapsibleSection>
    );

    expect(screen.getByText('Test Section')).toBeInTheDocument();
  });

  test('shows children when open', () => {
    render(
      <CollapsibleSection title="Test Section" isOpen={true} onToggle={mockOnToggle}>
        <div>Section Content</div>
      </CollapsibleSection>
    );

    expect(screen.getByText('Section Content')).toBeInTheDocument();
  });

  test('hides children when closed', () => {
    render(
      <CollapsibleSection title="Test Section" isOpen={false} onToggle={mockOnToggle}>
        <div>Section Content</div>
      </CollapsibleSection>
    );

    expect(screen.queryByText('Section Content')).not.toBeInTheDocument();
  });

  test('calls onToggle when header clicked', () => {
    render(
      <CollapsibleSection title="Test Section" isOpen={true} onToggle={mockOnToggle}>
        <div>Content</div>
      </CollapsibleSection>
    );

    fireEvent.click(screen.getByText('Test Section'));

    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  test('applies custom className', () => {
    const { container } = render(
      <CollapsibleSection title="Test Section" isOpen={true} onToggle={mockOnToggle} className="custom-class">
        <div>Content</div>
      </CollapsibleSection>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  test('shows down chevron when open', () => {
    const { container } = render(
      <CollapsibleSection title="Test Section" isOpen={true} onToggle={mockOnToggle}>
        <div>Content</div>
      </CollapsibleSection>
    );

    // The ChevronDownIcon should be present when open
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('shows right chevron when closed', () => {
    const { container } = render(
      <CollapsibleSection title="Test Section" isOpen={false} onToggle={mockOnToggle}>
        <div>Content</div>
      </CollapsibleSection>
    );

    // The ChevronRightIcon should be present when closed
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
