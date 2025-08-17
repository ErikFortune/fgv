import React from 'react';
import PresentationModeSelector from './PresentationModeSelector';

interface ViewWithPresentationSelectorProps {
  title: string;
  presentationMode: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover';
  onPresentationChange: (mode: 'hidden' | 'inline' | 'collapsible' | 'popup' | 'popover') => void;
  children: React.ReactNode;
}

const ViewWithPresentationSelector: React.FC<ViewWithPresentationSelectorProps> = ({
  title,
  presentationMode,
  onPresentationChange,
  children
}) => {
  return (
    <>
      {/* Floating presentation selector - positioned absolutely relative to viewport */}
      <div className="fixed top-20 right-4 z-50">
        <PresentationModeSelector value={presentationMode} onChange={onPresentationChange} className="w-32" />
      </div>

      {/* View content - completely unchanged */}
      {children}
    </>
  );
};

export default ViewWithPresentationSelector;
