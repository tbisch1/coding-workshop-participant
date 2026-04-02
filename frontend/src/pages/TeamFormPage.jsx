import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchIndividuals, fetchTeam, createTeam, updateTeam } from '../services/api';
import { IndividualFormModal } from '../components/IndividualFormModal';
import './TeamFormPage.css';

/**
 * Form page for creating or updating a team.
 */
function TeamFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mode = id ? 'update' : 'create';

  const [individuals, setIndividuals] = useState([]);
  const [showIndividualModal, setShowIndividualModal] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataNotFound, setDataNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    organization: 'Technology',
    team_lead_id: '',
    member_ids: [],
  });

  useEffect(() => {
    async function loadData() {
      setDataLoading(true);
      try {
        const [individualsData, teamData] = await Promise.all([
          fetchIndividuals(),
          id ? fetchTeam(id) : Promise.resolve(null),
        ]);
        setIndividuals(individualsData);
        if (id && !teamData) {
          setDataNotFound(true);
        } else if (teamData) {
          setFormData({
            name: teamData.name || '',
            organization: teamData.organization || 'Technology',
            team_lead_id: teamData.team_lead?.id || '',
            member_ids: teamData.members?.map((m) => m.id) || [],
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMembersChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, member_ids: selectedOptions }));
  };

  const handleIndividualCreated = (newIndividual) => {
    // Add new individual to the list
    setIndividuals(prev => [...prev, newIndividual]);
    
    // If modal was for creating a team lead, auto-select them
    if (showIndividualModal === 'lead') {
      setFormData(prev => ({ ...prev, team_lead_id: newIndividual.id }));
    }
    // If modal was for creating a member, add them to members
    else if (showIndividualModal === 'member') {
      setFormData(prev => ({
        ...prev,
        member_ids: [...prev.member_ids, newIndividual.id]
      }));
    }
    
    setShowIndividualModal(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }
    if (!formData.team_lead_id) {
      setError('Team lead is required');
      return;
    }

    setLoading(true);
    try {
      // Format data for API
      const teamData = {
        name: formData.name,
        organization: formData.organization,
        team_lead_id: formData.team_lead_id,
        member_ids: formData.member_ids,
      };

      if (mode === 'create') {
        const newTeam = await createTeam(teamData);
        navigate(`/team/${newTeam.id}`);
      } else {
        const updatedTeam = await updateTeam(id, teamData);
        navigate(`/team/${updatedTeam.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="team-form-page">
        <div className="team-form-page__content">
          <p style={{ color: '#64748b', marginTop: '2rem' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (mode === 'update' && dataNotFound) {
    return (
      <div className="team-form-page">
        <div className="team-form-page__content">
          <p style={{ color: '#64748b', marginTop: '2rem' }}>Team not found.</p>
        </div>
      </div>
    );
  }

  const title = mode === 'create' ? 'Create Team' : 'Update Team';

  return (
    <div className="team-form-page">
      <div className="team-form-page__content">

      <div className="team-form-container">
        <h1 className="team-form__title">{title}</h1>

        <form onSubmit={handleSubmit} className="team-form">
          <div className="form-group">
            <label htmlFor="name" className="form-group__label">Team Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Alpha Squad"
              className="form-group__input"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="organization" className="form-group__label">Organization</label>
            <select
              id="organization"
              name="organization"
              value={formData.organization}
              onChange={handleChange}
              className="form-group__input form-group__select"
              disabled={loading}
            >
              <option value="Technology">Technology</option>
              <option value="Credit Cards">Credit Cards</option>
              <option value="Private Banking">Private Banking</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="team_lead_id" className="form-group__label">Team Lead</label>
            <div className="dropdown-with-action">
              <select
                id="team_lead_id"
                name="team_lead_id"
                value={formData.team_lead_id}
                onChange={handleChange}
                className="form-group__input form-group__select"
                disabled={loading}
              >
                <option value="">Select a team lead...</option>
                {individuals.map(individual => (
                  <option key={individual.id} value={individual.id}>
                    {individual.name} ({individual.position})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="dropdown-action-btn"
                onClick={() => setShowIndividualModal('lead')}
                disabled={loading}
                title="Create a new individual"
              >
                +
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="member_ids" className="form-group__label">
              Team Members <span className="form-group__optional">(optional)</span>
            </label>
            <div className="dropdown-with-action">
              <select
                id="member_ids"
                multiple
                value={formData.member_ids}
                onChange={handleMembersChange}
                className="form-group__input form-group__select form-group__select--multiple"
                disabled={loading}
              >
                {individuals
                  .filter(i => i.id !== formData.team_lead_id)
                  .map(individual => (
                    <option key={individual.id} value={individual.id}>
                      {individual.name} ({individual.position})
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="dropdown-action-btn"
                onClick={() => setShowIndividualModal('member')}
                disabled={loading}
                title="Create a new individual"
              >
                +
              </button>
            </div>
            <p className="form-group__helper">Hold Ctrl (Cmd on Mac) to select multiple members</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="form-actions__btn form-actions__btn--cancel"
              onClick={() => navigate('/')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="form-actions__btn form-actions__btn--submit"
              disabled={loading || !formData.team_lead_id}
            >
              {loading ? 'Submitting…' : (mode === 'create' ? 'Create Team' : 'Update Team')}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </form>
      </div>
      </div>

      {showIndividualModal && (
        <IndividualFormModal
          onClose={() => setShowIndividualModal(null)}
          onIndividualCreated={handleIndividualCreated}
        />
      )}
    </div>
  );
}

export default TeamFormPage;
