import { useState } from 'react';
import { IndividualFormContent } from './IndividualFormContent';
import { createIndividual } from '../services/api';

/**
 * Modal version of the individual form for inline creation.
 * Used when creating an individual while in team creation context.
 */
export function IndividualFormModal({ onClose, onIndividualCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const newIndividual = await createIndividual(formData);
      onIndividualCreated(newIndividual);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="individual-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h3 className="modal__title">Create Individual</h3>
          <button className="modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="modal__body">
          <IndividualFormContent
            mode="create"
            onSubmit={handleSubmit}
            loading={loading}
          />
          
          {error && (
            <div className="error-message" style={{ marginTop: '1rem' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
