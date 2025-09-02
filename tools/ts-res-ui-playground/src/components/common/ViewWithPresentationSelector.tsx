import React, { useState, useRef, useEffect } from 'react';
import { CogIcon } from '@heroicons/react/24/outline';

interface ViewWithPresentationSelectorProps {
  currentPresentation: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
  onPresentationChange: (mode: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover') => void;
  children: React.ReactNode;
}

// Export the gear icon component that views can use
export const PresentationGearIcon: React.FC<{
  currentPresentation: 'hidden' | 'inline' | 'collapsible';
  onPresentationChange: (mode: 'hidden' | 'inline' | 'collapsible') => void;
}> = ({ currentPresentation, onPresentationChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presentationOptions = [
    { value: 'hidden', label: 'Hidden' },
    { value: 'inline', label: 'Inline' },
    { value: 'collapsible', label: 'Collapsible' }
  ] as const;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Picker Options Settings"
      >
        <CogIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-8 z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-36">
          <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b border-gray-100">
            Picker Options
          </div>
          {presentationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onPresentationChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-1 text-sm hover:bg-gray-50 ${
                currentPresentation === option.value
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const ViewWithPresentationSelector: React.FC<ViewWithPresentationSelectorProps> = ({
  currentPresentation,
  onPresentationChange,
  children
}) => {
  return <>{children}</>;
};

export default ViewWithPresentationSelector;
