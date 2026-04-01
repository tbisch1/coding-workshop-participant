import { useState } from 'react';
import DashboardPage from './pages/DashboardPage';

/**
 * Root application component with simple state-based navigation.
 */
function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');

  /**
   * Navigates to the specified page.
   * @param {string} page - The page identifier to navigate to
   */
  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  if (currentPage === 'dashboard') {
    return <DashboardPage onNavigate={handleNavigate} />;
  }

  // Placeholder for future creation pages
  return (
    <div style={{ padding: '2rem', color: '#e2e8f0', background: '#0f1117', minHeight: '100vh' }}>
      <button
        onClick={() => handleNavigate('dashboard')}
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
      <h2 style={{ color: '#c7d2fe' }}>
        {currentPage === 'create-team' ? 'Create Team' : 'Create Individual'}
      </h2>
      <p style={{ color: '#64748b' }}>This page is coming soon.</p>
    </div>
  );
}

export default App;
