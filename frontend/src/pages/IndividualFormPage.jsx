import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockIndividuals } from '../services/mockData';
import { createIndividual, updateIndividual } from '../services/api';
import { IndividualFormContent } from '../components/IndividualFormContent';
import './IndividualFormPage.css';

/**
 * Full page for creating or updating an individual.
 */
function IndividualFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mode = id ? 'update' : 'create';
  const individual = id ? mockIndividuals.find((i) => i.id === id) : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (mode === 'update' && !individual) {
    return (
      <div className="individual-form-page">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <p style={{ color: '#64748b', marginTop: '2rem' }}>Individual not found.</p>
      </div>
    );
  }

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'create') {
        const newIndividual = await createIndividual(formData);
        navigate(`/individual/${newIndividual.id}`);
      } else {
        const updatedIndividual = await updateIndividual(id, formData);
        navigate(`/individual/${updatedIndividual.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="individual-form-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        ← Back
      </button>

      <div className="individual-form-container">
        <IndividualFormContent
          mode={mode}
          individual={individual}
          onSubmit={handleSubmit}
          loading={loading}
        />
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default IndividualFormPage;
