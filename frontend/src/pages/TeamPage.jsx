import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockTeams, mockIndividuals, mockAccomplishments } from '../services/mockData';
import './TeamPage.css';

/**
 * Confirmation dialog for delete actions.
 */
function ConfirmDialog({ message, onConfirm, onCancel, loading }) {
  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true">
      <div className="dialog">
        <p className="dialog__message">{message}</p>
        {loading && <p className="dialog__loading">Deleting…</p>}
        <div className="dialog__actions">
          <button className="dialog__btn dialog__btn--cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="dialog__btn dialog__btn--confirm" onClick={onConfirm} disabled={loading}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * A member card in the team members list.
 */
function MemberCard({ individual, onRemove, isTeamLead }) {
  if (!individual) return null;

  const initials = individual.name
    ? individual.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="member-card">
      <div className="member-card__avatar">{initials}</div>
      <div className="member-card__info">
        <span className="member-card__name">{individual.name}</span>
        <span className="member-card__position">{individual.position}</span>
        {isTeamLead && <span className="member-card__badge">Team Lead</span>}
      </div>
      {!isTeamLead && (
        <button
          className="member-card__remove"
          onClick={() => onRemove(individual)}
          aria-label={`Remove ${individual.name}`}
          title="Remove from team"
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * An accomplishment card with edit/delete actions.
 */
function AccomplishmentCard({ accomplishment, onEdit, onDelete }) {
  return (
    <div className="accomplishment-card">
      <div className="accomplishment-card__content">
        <p className="accomplishment-card__description">{accomplishment.description}</p>
        <span className="accomplishment-card__date">{accomplishment.date}</span>
      </div>
      <div className="accomplishment-card__actions">
        <button
          className="card-action-btn card-action-btn--edit"
          onClick={() => onEdit(accomplishment)}
          aria-label="Edit accomplishment"
          title="Edit"
        >
          ✏
        </button>
        <button
          className="card-action-btn card-action-btn--delete"
          onClick={() => onDelete(accomplishment)}
          aria-label="Delete accomplishment"
          title="Delete"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

/**
 * Modal to add a team member.
 */
function AddMemberModal({ availableIndividuals, onAddMember, onClose }) {
  const [search, setSearch] = useState('');

  const filtered = availableIndividuals.filter((i) =>
    [i.name, i.email, i.position]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <div className="modal__header">
          <h3 className="modal__title">Add Team Member</h3>
          <button
            className="modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal__body">
          <input
            type="search"
            className="modal__search"
            placeholder="Search individuals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />

          <ul className="individual-list">
            {filtered.length === 0 ? (
              <li className="individual-list__empty">No individuals available</li>
            ) : (
              filtered.map((individual) => (
                <li key={individual.id}>
                  <button
                    className="individual-list__item"
                    onClick={() => {
                      onAddMember(individual);
                      onClose();
                    }}
                  >
                    <span className="individual-list__name">{individual.name}</span>
                    <span className="individual-list__position">{individual.position}</span>
                  </button>
                </li>
              ))
            )}
          </ul>

          <button className="modal__create-new">
            + Create New Individual
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Team detail page showing members and accomplishments.
 */
function TeamPage() {
  const { id: teamId } = useParams();
  const navigate = useNavigate();
  const team = mockTeams.find((t) => t.id === teamId);
  const teamAccomplishments = mockAccomplishments.filter((a) => a.teamId === teamId);

  const [members, setMembers] = useState([
    team?.team_lead || mockIndividuals.find((i) => i.id === team?.team_lead?.id),
  ].filter(Boolean));

  const [accomplishments, setAccomplishments] = useState(teamAccomplishments);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Find team lead's id from mockIndividuals by matching email
  const teamLeadFromIndividuals = team?.team_lead 
    ? mockIndividuals.find((i) => i.email === team.team_lead.email)
    : null;
  const teamLeadId = teamLeadFromIndividuals?.id;

  const memberIds = members.map((m) => m.id);
  const availableIndividuals = mockIndividuals.filter(
    (i) => !memberIds.includes(i.id) && i.id !== teamLeadId
  );

  const handleAddMember = (individual) => {
    setMembers([...members, individual]);
  };

  const handleRemoveMember = (individual) => {
    setMembers(members.filter((m) => m.id !== individual.id));
  };

  const handleDeleteAccomplishment = (accomplishment) => {
    setConfirmDialog({
      message: 'Delete this accomplishment? This action cannot be undone.',
      onConfirm: async () => {
        setDeleteLoading(true);
        try {
          setAccomplishments(accomplishments.filter((a) => a.id !== accomplishment.id));
        } finally {
          setDeleteLoading(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  if (!team) {
    return (
      <div className="team-page">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Back
        </button>
        <p style={{ color: '#64748b', marginTop: '2rem' }}>Team not found.</p>
      </div>
    );
  }

  return (
    <div className="team-page">
      <button className="back-btn" onClick={() => navigate('/')}>
        ← Back
      </button>

      <header className="team-header">
        <h1 className="team-header__name">{team.name}</h1>
        <div className="team-header__meta">
          <span className="team-header__org">{team.organization}</span>
          <span className="team-header__lead">Led by {team.team_lead.name}</span>
        </div>
      </header>

      <div className="team-columns">
        <section className="team-column">
          <div className="column-header">
            <h2 className="column-title">Team Members</h2>
            <span className="column-count">{members.length}</span>
            <button
              className="add-btn"
              onClick={() => setShowAddMemberModal(true)}
              title="Add member"
            >
              +
            </button>
          </div>

          <ul className="members-list">
            {members.map((member) => member && (
              <li key={member.id}>
                <MemberCard
                  individual={member}
                  onRemove={handleRemoveMember}
                  isTeamLead={member.email === team?.team_lead?.email}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="team-column">
          <div className="column-header">
            <h2 className="column-title">Accomplishments</h2>
            <span className="column-count">{accomplishments.length}</span>
            <button
              className="add-btn"
              onClick={() => navigate('/create-accomplishment', { state: team })}
              title="Add accomplishment"
            >
              +
            </button>
          </div>

          <ul className="accomplishments-list">
            {accomplishments.length === 0 ? (
              <li style={{ listStyle: 'none' }} className="empty-message">No accomplishments yet.</li>
            ) : (
              accomplishments.map((acc) => (
                <li key={acc.id}>
                  <AccomplishmentCard
                    accomplishment={acc}
                    onEdit={() => navigate('/edit-accomplishment', { state: acc })}
                    onDelete={() => handleDeleteAccomplishment(acc)}
                  />
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      {showAddMemberModal && (
        <AddMemberModal
          availableIndividuals={availableIndividuals}
          onAddMember={handleAddMember}
          onClose={() => setShowAddMemberModal(false)}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}

export default TeamPage;
