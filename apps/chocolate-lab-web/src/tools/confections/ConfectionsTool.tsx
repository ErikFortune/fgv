/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { useChocolate } from '../../contexts/ChocolateContext';

/**
 * Placeholder confections tool
 */
export function ConfectionsTool(): React.ReactElement {
  const { confectionCount } = useChocolate();

  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Confections</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-4">{confectionCount} confections loaded</p>
      <p className="text-sm text-gray-400 dark:text-gray-500">Confection planning and tracking coming soon</p>
    </div>
  );
}
