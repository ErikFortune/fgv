/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import '@testing-library/jest-dom';
import * as React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchInput } from '../../../packlets/filters';

describe('SearchInput', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  test('renders with placeholder', () => {
    render(<SearchInput value="" onChange={mockOnChange} placeholder="Search items..." />);

    expect(screen.getByPlaceholderText('Search items...')).toBeInTheDocument();
  });

  test('renders with default placeholder', () => {
    render(<SearchInput value="" onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  test('displays current value', () => {
    render(<SearchInput value="test query" onChange={mockOnChange} />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });

  test('calls onChange when input changes', () => {
    render(<SearchInput value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('Search...');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  test('shows clear button when value is present', () => {
    render(<SearchInput value="test" onChange={mockOnChange} />);

    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });

  test('hides clear button when value is empty', () => {
    render(<SearchInput value="" onChange={mockOnChange} />);

    expect(screen.queryByLabelText('Clear search')).not.toBeInTheDocument();
  });

  test('clears value when clear button clicked', () => {
    render(<SearchInput value="test" onChange={mockOnChange} />);

    fireEvent.click(screen.getByLabelText('Clear search'));

    expect(mockOnChange).toHaveBeenCalledWith('');
  });

  test('applies custom className', () => {
    const { container } = render(<SearchInput value="" onChange={mockOnChange} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
