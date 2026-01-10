/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useChocolate } from '../../contexts/ChocolateContext';

/**
 * Placeholder molds tool
 */
export function MoldsTool(): React.ReactElement {
  const { moldCount } = useChocolate();

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Molds</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{moldCount} molds loaded</p>
      <p className="text-sm text-gray-400 dark:text-gray-500">Mold catalog and management coming soon</p>
    </div>
  );
}
