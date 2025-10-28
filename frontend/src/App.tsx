import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { HomePage } from './pages/HomePage';
import { PetsPage } from './pages/PetsPage';
import { FeedingPage } from './pages/FeedingPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { CalendarPage } from './pages/CalendarPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <div className="app-content">
          <Navigation />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pets" element={<PetsPage />} />
              <Route path="/feeding" element={<FeedingPage />} />
              <Route path="/maintenance" element={<MaintenancePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;