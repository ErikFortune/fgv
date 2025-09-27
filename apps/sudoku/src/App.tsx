import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { GameSelectionPage } from './pages/GameSelectionPage';
import { PuzzlePage } from './pages/PuzzlePage';
import { ObservabilityProvider } from './contexts';
import { ToastProvider, useToast } from './components/Toast';

function AppContent() {
  const { showToast } = useToast();

  return (
    <ObservabilityProvider showToast={showToast}>
      <div className="App">
        <Navigation />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/select" element={<GameSelectionPage />} />
            <Route path="/puzzle/:gameType" element={<PuzzlePage />} />
          </Routes>
        </main>
      </div>
    </ObservabilityProvider>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
