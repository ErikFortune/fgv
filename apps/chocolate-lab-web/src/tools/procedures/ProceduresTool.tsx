/*
 * MIT License
 * Copyright (c) 2025 Erik Fortune
 */

import * as React from 'react';
import { BookOpenIcon } from '@heroicons/react/24/outline';

/**
 * Placeholder for the Procedures tool
 */
export function ProceduresTool(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <BookOpenIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Procedures</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        Browse and manage chocolate-making procedures. Step-by-step instructions for tempering, molding,
        enrobing, and more.
      </p>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">Coming soon</p>
    </div>
  );
}
