import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { GameSelectionPage } from './pages/GameSelectionPage';
import { PuzzlePage } from './pages/PuzzlePage';

function App() {
  return (
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
  );
}

export default App;
