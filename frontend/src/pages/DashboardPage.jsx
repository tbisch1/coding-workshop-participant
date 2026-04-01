import { useState, useEffect } from 'react';
import { fetchTeams, fetchIndividuals } from '../services/api';
import './DashboardPage.css';

/**
 * A single team card in the teams list.
 * @param {Object} props
 * @param {Object} props.team - The team data object
 */
function TeamCard({ team }) {
  return (
    <div className="list-card">
      <div className="list-card__avatar">
        {team.organization ? team.organization.charAt(0).toUpperCase() : 'T'}
      </div>
      <div className="list-card__info">
        <span className="list-card__name">{team.organization || 'Unnamed Team'}</span>
        <span className="list-card__sub">{team.location || 'No location'}</span>
      </div>
      {team.team_lead && (
        <span className="list-card__badge">Lead: {team.team_lead.name || team.team_lead}</span>
      )}
    </div>
  );
}

/**
 * A single individual card in the individuals list.
 * @param {Object} props
 * @param {Object} props.individual - The individual data object
 */
function IndividualCard({ individual }) {
  const initials = individual.name
    ? individual.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="list-card">
      <div className="list-card__avatar">{initials}</div>
      <div className="list-card__info">
        <span className="list-card__name">{individual.name || 'Unknown'}</span>
        <span className="list-card__sub">{individual.email || ''}</span>
      </div>
      <div className="list-card__meta">
        {individual.position && (
          <span className="list-card__badge">{individual.position}</span>
        )}
        {individual.location && (
          <span className="list-card__location">{individual.location}</span>
        )}
      </div>
    </div>
  );
}

/**
 * Section wrapper with title, count, and an add button.
 * @param {Object} props
 * @param {string} props.title - Section heading
 * @param {number} props.count - Number of items
 * @param {Function} props.onAdd - Callback for the add button
 * @param {boolean} props.loading - Whether data is loading
 * @param {string|null} props.error - Error message, if any
 * @param {React.ReactNode} props.children - List content
 */
function Section({ title, count, onAdd, loading, error, children }) {
  return (
    <section className="dashboard-section">
      <div className="dashboard-section__header">
        <div className="dashboard-section__title-row">
          <h2 className="dashboard-section__title">{title}</h2>
          {!loading && !error && (
            <span className="dashboard-section__count">{count}</span>
          )}
        </div>
        <button
          className="add-btn"
          onClick={onAdd}
          aria-label={`Add new ${title.toLowerCase().slice(0, -1)}`}
          title={`Add new ${title.toLowerCase().slice(0, -1)}`}
        >
          +
        </button>
      </div>

      <div className="dashboard-section__body">
        {loading && (
          <div className="state-message">
            <span className="spinner" />
            Loading {title.toLowerCase()}…
          </div>
        )}
        {!loading && error && (
          <div className="state-message state-message--error">{error}</div>
        )}
        {!loading && !error && count === 0 && (
          <div className="state-message state-message--empty">
            No {title.toLowerCase()} found. Add one to get started.
          </div>
        )}
        {!loading && !error && count > 0 && (
          <ul className="card-list">{children}</ul>
        )}
      </div>
    </section>
  );
}

/**
 * Main dashboard page displaying teams and individuals.
 * @param {Object} props
 * @param {Function} props.onNavigate - Callback to navigate to another page
 */
function DashboardPage({ onNavigate }) {
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState(null);

  const [individuals, setIndividuals] = useState([]);
  const [individualsLoading, setIndividualsLoading] = useState(true);
  const [individualsError, setIndividualsError] = useState(null);

  useEffect(() => {
    fetchTeams()
      .then(setTeams)
      .catch((err) => setTeamsError(err.message))
      .finally(() => setTeamsLoading(false));

    fetchIndividuals()
      .then(setIndividuals)
      .catch((err) => setIndividualsError(err.message))
      .finally(() => setIndividualsLoading(false));
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header__inner">
          <div className="dashboard-header__brand">
            <span className="dashboard-header__icon">⬡</span>
            <h1 className="dashboard-header__title">Team Management</h1>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <Section
          title="Teams"
          count={teams.length}
          onAdd={() => onNavigate('create-team')}
          loading={teamsLoading}
          error={teamsError}
        >
          {teams.map((team, index) => (
            <li key={team.id || index}>
              <TeamCard team={team} />
            </li>
          ))}
        </Section>

        <Section
          title="Individuals"
          count={individuals.length}
          onAdd={() => onNavigate('create-individual')}
          loading={individualsLoading}
          error={individualsError}
        >
          {individuals.map((individual) => (
            <li key={individual.id}>
              <IndividualCard individual={individual} />
            </li>
          ))}
        </Section>
      </main>
    </div>
  );
}

export default DashboardPage;
