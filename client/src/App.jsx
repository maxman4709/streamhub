import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AdminGate from './components/AdminGate';
import Home from './pages/Home';
import Watch from './pages/Watch';
import Admin from './pages/Admin';
import ActorPage from './pages/ActorPage';
import Channels from './pages/Channels';
import ActorsBrowse from './pages/ActorsBrowse';
import ActressesBrowse from './pages/ActressesBrowse';
import Favorites from './pages/Favorites';

function App() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/channels" element={<Channels />} />
          <Route path="/actors" element={<ActorsBrowse />} />
          <Route path="/actresses" element={<ActressesBrowse />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/watch/:id" element={<Watch />} />
          <Route path="/actor/:id" element={<ActorPage />} />
          <Route path="/admin" element={<AdminGate><Admin /></AdminGate>} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
