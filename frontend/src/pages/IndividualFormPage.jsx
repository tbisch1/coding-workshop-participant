import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchIndividual, createIndividual, updateIndividual } from '../services/api';
import { IndividualFormContent } from '../components/IndividualFormContent';
import './IndividualFormPage.css';

/**
 * Full page for creating or updating an individual.
 */
function IndividualFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mode = id ? 'update' : 'create';
  const [individual, setIndividual] = useState(null);
  const [dataLoading, setDataLoading] = useState(!!id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setDataLoading(true);
      try {
        const data = await fetchIndividual(id);
        setIndividual(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    }
    load();
  }, [id]);

  if (dataLoading) {
    return (
      <div className="individual-form-page">
        <div className="individual-form-page__content">
          <p style={{ color: '#64748b', marginTop: '2rem' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (mode === 'update' && !individual) {
    return (
      <div className="individual-form-page">
        <div className="individual-form-page__content">
          <p style={{ color: '#64748b', marginTop: '2rem' }}>Individual not found.</p>
        </div>
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
      <div className="individual-form-page__content">

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
    </div>
  );
}

export default IndividualFormPage;
