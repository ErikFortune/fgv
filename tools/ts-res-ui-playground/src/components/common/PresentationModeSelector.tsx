import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface PresentationModeSelectorProps {
  value: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
  onChange: (mode: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover') => void;
  className?: string;
}

const PresentationModeSelector: React.FC<PresentationModeSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const options = [
    { value: 'hidden', label: 'Hidden' },
    { value: 'popover', label: 'Popover' },
    { value: 'collapsible', label: 'Collapsible' },
    { value: 'popup', label: 'Popup' },
    { value: 'inline', label: 'Inline' }
  ] as const;

  return (
    <div className={`relative ${className}`}>
      <label className="block text-xs font-medium text-gray-700 mb-1">Picker Options</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as any)}
          className="appearance-none block w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-8"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default PresentationModeSelector;
