import { useState, useEffect } from 'react';
import { fetchTeams, fetchIndividuals } from '../services/api';
import './DashboardPage.css';

/**
 * A single team card in the teams list.
 * @param {Object} props
 * @param {Object} props.team - The team data object
 */
function TeamCard({ team, onEdit, onDelete }) {
  const nameInitial = team.name ? team.name.charAt(0).toUpperCase() : 'T';

  return (
    <div className="list-card">
      <div className="list-card__avatar team-avatar">{nameInitial}</div>
      <div className="list-card__info">
        <span className="list-card__name">{team.name || 'Unnamed Team'}</span>
        <span className="list-card__sub">{team.organization}</span>
      </div>
      {team.team_lead && (
        <div className="team-lead">
          <span className="team-lead__label">Lead</span>
          <span className="team-lead__name">{team.team_lead.name}</span>
        </div>
      )}
      <div className="card-actions">
        <button
          className="card-action-btn card-action-btn--edit"
          onClick={() => onEdit(team)}
          aria-label={`Edit ${team.name}`}
          title="Edit"
        >
          ✏
        </button>
        <button
          className="card-action-btn card-action-btn--delete"
          onClick={() => onDelete(team)}
          aria-label={`Delete ${team.name}`}
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

/**
 * A single individual card in the individuals list.
 * @param {Object} props
 * @param {Object} props.individual - The individual data object
 */
function IndividualCard({ individual, onEdit, onDelete }) {
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
      <div className="card-actions">
        <button
          className="card-action-btn card-action-btn--edit"
          onClick={() => onEdit(individual)}
          aria-label={`Edit ${individual.name}`}
          title="Edit"
        >
          ✏
        </button>
        <button
          className="card-action-btn card-action-btn--delete"
          onClick={() => onDelete(individual)}
          aria-label={`Delete ${individual.name}`}
          title="Delete"
        >
          🗑
        </button>
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
function Section({ title, count, onAdd, onSearch, searchQuery, loading, error, children }) {
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

      <div className="dashboard-section__search">
        <input
          className="search-input"
          type="search"
          placeholder={`Search ${title.toLowerCase()}…`}
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          aria-label={`Search ${title.toLowerCase()}`}
        />
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
            No {title.toLowerCase()} found. {searchQuery ? 'Try a different search.' : 'Add one to get started.'}
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
  const [teamsSearch, setTeamsSearch] = useState('');

  const [individuals, setIndividuals] = useState([]);
  const [individualsLoading, setIndividualsLoading] = useState(true);
  const [individualsError, setIndividualsError] = useState(null);
  const [individualsSearch, setIndividualsSearch] = useState('');

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

  const filteredTeams = teams.filter((t) =>
    [t.name, t.organization, t.team_lead?.name]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(teamsSearch.toLowerCase()))
  );

  const filteredIndividuals = individuals.filter((i) =>
    [i.name, i.email, i.position, i.location]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(individualsSearch.toLowerCase()))
  );

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
          count={filteredTeams.length}
          onAdd={() => onNavigate('create-team')}
          onSearch={setTeamsSearch}
          searchQuery={teamsSearch}
          loading={teamsLoading}
          error={teamsError}
        >
          {filteredTeams.map((team, index) => (
            <li key={team.id || index}>
              <TeamCard
                team={team}
                onEdit={(t) => onNavigate('edit-team', t)}
                onDelete={(t) => onNavigate('delete-team', t)}
              />
            </li>
          ))}
        </Section>

        <Section
          title="Individuals"
          count={filteredIndividuals.length}
          onAdd={() => onNavigate('create-individual')}
          onSearch={setIndividualsSearch}
          searchQuery={individualsSearch}
          loading={individualsLoading}
          error={individualsError}
        >
          {filteredIndividuals.map((individual) => (
            <li key={individual.id}>
              <IndividualCard
                individual={individual}
                onEdit={(i) => onNavigate('edit-individual', i)}
                onDelete={(i) => onNavigate('delete-individual', i)}
              />
            </li>
          ))}
        </Section>
      </main>
    </div>
  );
}

export default DashboardPage;
