import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchIndividual, fetchTeamsForIndividual } from '../services/api';
import './IndividualPage.css';

/**
 * Displays basic information about an individual.
 */
function IndividualInfo({ individual, onEdit }) {
  const initials = individual.name
    ? individual.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="individual-header">
      <div className="individual-header__avatar">{initials}</div>
      <div className="individual-header__info">
        <div className="individual-header__title-row">
          <h1 className="individual-header__name">{individual.name}</h1>
          <button
            className="individual-header__edit-btn"
            onClick={onEdit}
            title="Edit individual"
          >
            Edit
          </button>
        </div>
        <div className="individual-header__details">
          <span className="individual-header__email">{individual.email}</span>
          <span className="individual-header__separator">•</span>
          <span className="individual-header__position">{individual.position}</span>
          <span className="individual-header__separator">•</span>
          <span className="individual-header__location">{individual.location}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Table row for a team.
 */
function TeamRow({ team, onTeamClick }) {
  return (
    <tr className="team-table__row" onClick={() => onTeamClick(team)}>
      <td className="team-table__cell team-table__cell--name">
        <span className="team-table__team-name">{team.name}</span>
      </td>
      <td className="team-table__cell team-table__cell--org">
        {team.organization}
      </td>
      <td className="team-table__cell team-table__cell--lead">
        {team.team_lead?.name || 'N/A'}
      </td>
    </tr>
  );
}

/**
 * Individual detail page showing personal information and team memberships.
 */
function IndividualPage() {
  const { id: individualId } = useParams();
  const navigate = useNavigate();
  const [individual, setIndividual] = useState(null);
  const [individualsTeams, setIndividualsTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch individual data and their teams on mount or when individualId changes
  useEffect(() => {
    const loadIndividualAndTeams = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedIndividual = await fetchIndividual(individualId);
        setIndividual(fetchedIndividual);
        
        if (fetchedIndividual) {
          const teams = await fetchTeamsForIndividual(individualId);
          setIndividualsTeams(teams || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (individualId) {
      loadIndividualAndTeams();
    }
  }, [individualId]);

  if (loading) {
    return (
      <div className="individual-page">
        <div className="individual-page__content">
          <p style={{ color: '#64748b', marginTop: '2rem' }}>Loading individual...</p>
        </div>
      </div>
    );
  }

  if (!individual || error) {
    return (
      <div className="individual-page">
        <div className="individual-page__content">
          <p style={{ color: '#64748b', marginTop: '2rem' }}>{error ? `Error: ${error}` : 'Individual not found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="individual-page">
      <div className="individual-page__content">

      <IndividualInfo individual={individual} onEdit={() => navigate(`/individual/${individualId}/edit`)} />

      <section className="teams-section">
        <div className="section-header">
          <h2 className="section-title">Teams</h2>
          <span className="section-count">{individualsTeams.length}</span>
        </div>

        {individualsTeams.length === 0 ? (
          <p className="no-data-message">This individual is not part of any teams yet.</p>
        ) : (
          <div className="team-table-wrapper">
            <table className="team-table">
              <thead className="team-table__head">
                <tr className="team-table__header-row">
                  <th className="team-table__header team-table__header--name">Team Name</th>
                  <th className="team-table__header team-table__header--org">Organization</th>
                  <th className="team-table__header team-table__header--lead">Team Lead</th>
                </tr>
              </thead>
              <tbody className="team-table__body">
                {individualsTeams.map((team) => (
                  <TeamRow
                    key={team.id}
                    team={team}
                    onTeamClick={() => navigate(`/team/${team.id}`)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      </div>
    </div>
  );
}

export default IndividualPage;
