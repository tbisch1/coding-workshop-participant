import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import TeamPage from './pages/TeamPage';
import IndividualPage from './pages/IndividualPage';
import TeamFormPage from './pages/TeamFormPage';
import IndividualFormPage from './pages/IndividualFormPage';

/**
 * Dashboard wrapper that passes navigate function.
 */
function DashboardWrapper() {
  const navigate = useNavigate();
  const handleNavigate = (page, data) => {
    if (page === 'view-team') {
      navigate(`/team/${data.id}`);
    } else if (page === 'view-individual') {
      navigate(`/individual/${data.id}`);
    } else if (page === 'create-team') {
      navigate('/team');
    } else if (page === 'create-individual') {
      navigate('/individual');
    } else if (page === 'edit-team') {
      navigate(`/team/${data.id}/edit`);
    } else if (page === 'edit-individual') {
      navigate(`/individual/${data.id}/edit`);
    } else {
      navigate(`/${page}`, { state: data });
    }
  };
  return <DashboardPage onNavigate={handleNavigate} />;
}

/**
 * Team detail page wrapper.
 */
function TeamPageWrapper() {
  const navigate = useNavigate();
  return <TeamPage />;
}

/**
 * Individual detail page wrapper.
 */
function IndividualPageWrapper() {
  const navigate = useNavigate();
  return <IndividualPage />;
}

/**
 * Root application component with React Router.
 */
function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<DashboardWrapper />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/team/:id" element={<TeamPageWrapper />} />
        <Route path="/team" element={<TeamFormPage />} />
        <Route path="/team/:id/edit" element={<TeamFormPage />} />
        <Route path="/individual/:id" element={<IndividualPageWrapper />} />
        <Route path="/individual" element={<IndividualFormPage />} />
        <Route path="/individual/:id/edit" element={<IndividualFormPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function NotFound() {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '2rem', color: '#e2e8f0', background: '#0f1117', minHeight: '100vh' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          background: 'transparent',
          border: '1px solid #6c63ff',
          color: '#6c63ff',
          borderRadius: '8px',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          marginBottom: '1.5rem',
        }}
      >
        ← Back
      </button>
      <h2 style={{ color: '#c7d2fe' }}>Page not found</h2>
      <p style={{ color: '#64748b' }}>The page you're looking for doesn't exist.</p>
    </div>
  );
}

export default App;
