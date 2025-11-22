/**
 * Main App Component with Routing
 */

import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AnimationProvider } from './context/AnimationContext';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';

function App() {
  return (
    <AppProvider>
      <AnimationProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </AnimationProvider>
    </AppProvider>
  );
}

export default App;

