/**
 * localDb.js
 *
 * Database seeded from database.json and persisted to localStorage.
 * Stores raw FK-based records and exposes CRUD methods that resolve
 * foreign keys into nested objects — matching the shape api.js expects.
 *
 * Writes are persisted to localStorage and survive page refreshes.
 */

import seed from './database.json';

const STORAGE_KEY = 'localDb';

// Load from localStorage if available, otherwise fall back to seed data
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors and fall back to seed
  }
  return null;
}

const stored = loadFromStorage();
let individuals = (stored?.individuals ?? seed.individuals).map(i => ({ ...i }));
let teams = (stored?.teams ?? seed.teams).map(t => ({ ...t }));
let team_individuals = (stored?.team_individuals ?? seed.team_individuals).map(ti => ({ ...ti }));
let accomplishments = (stored?.accomplishments ?? seed.accomplishments).map(a => ({ ...a }));

let nextId = 1000; // Starting ID for new records to avoid seed collisions
const getMaxId = () => {
  const allIds = [
    ...individuals.map(i => parseInt(i.id, 10)),
    ...teams.map(t => parseInt(t.id, 10)),
    ...team_individuals.map(ti => parseInt(ti.id, 10)),
    ...accomplishments.map(a => parseInt(a.id, 10)),
  ].filter(id => !isNaN(id));
  
  return allIds.length > 0 ? Math.max(...allIds) : nextId - 1;
};

const genId = () => String(getMaxId() + 1);

// Persist all collections to localStorage after every write
function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ individuals, teams, team_individuals, accomplishments }));
}

// ─── Resolution helpers ───────────────────────────────────────────────────────

/**
 * Returns a fully resolved Individual object by ID, or null if not found.
 * @param {string} id
 */
function resolveIndividual(id) {
  return individuals.find(i => i.id === id) || null;
}

/**
 * Returns a fully resolved Team object with team_lead and members embedded.
 * @param {string} id
 */
function resolveTeam(id) {
  const team = teams.find(t => t.id === id);
  if (!team) return null;

  const team_lead = resolveIndividual(team.team_lead_id);

  const members = team_individuals
    .filter(ti => ti.team_id === id)
    .map(ti => resolveIndividual(ti.individual_id))
    .filter(Boolean);

  return {
    id: team.id,
    name: team.name,
    organization: team.organization,
    team_lead,
    members,
  };
}

/**
 * Returns a fully resolved Accomplishment object by ID.
 * @param {string} id
 */
function resolveAccomplishment(id) {
  const acc = accomplishments.find(a => a.id === id);
  if (!acc) return null;
  return {
    id: acc.id,
    team_id: acc.team_id,
    description: acc.description,
    date: acc.date,
  };
}

// ─── Individuals ─────────────────────────────────────────────────────────────

export const localDb = {
  // Individuals
  getIndividuals() {
    return individuals.map(i => ({ ...i }));
  },

  getIndividual(id) {
    return resolveIndividual(id);
  },

  createIndividual(data) {
    const record = { id: genId(), ...data };
    individuals.push(record);
    persist();
    return { ...record };
  },

  updateIndividual(id, data) {
    const idx = individuals.findIndex(i => i.id === id);
    if (idx === -1) return null;
    // Only update the password field if a new one was provided
    const updated = {
      ...individuals[idx],
      ...data,
      password: data.password?.trim() ? data.password : individuals[idx].password,
      id,
    };
    individuals[idx] = updated;
    persist();
    return { ...updated };
  },

  deleteIndividual(id) {
    individuals = individuals.filter(i => i.id !== id);
    // Also remove from any team memberships
    team_individuals = team_individuals.filter(ti => ti.individual_id !== id);
    persist();
    return true;
  },

  // ─── Teams ─────────────────────────────────────────────────────────────────

  getTeams() {
    return teams.map(t => resolveTeam(t.id)).filter(Boolean);
  },

  getTeam(id) {
    return resolveTeam(id);
  },

  createTeam(data) {
    const { member_ids = [], ...rest } = data;
    const record = { id: genId(), ...rest };
    teams.push(record);

    // Create team_individual join records for each member
    member_ids.forEach(individual_id => {
      team_individuals.push({ id: genId(), team_id: record.id, individual_id });
    });

    persist();
    return resolveTeam(record.id);
  },

  updateTeam(id, data) {
    const idx = teams.findIndex(t => t.id === id);
    if (idx === -1) return null;

    const { member_ids, ...rest } = data;
    teams[idx] = { ...teams[idx], ...rest, id };

    // If member_ids provided, replace all memberships for this team
    if (Array.isArray(member_ids)) {
      team_individuals = team_individuals.filter(ti => ti.team_id !== id);
      member_ids.forEach(individual_id => {
        team_individuals.push({ id: genId(), team_id: id, individual_id });
      });
    }

    persist();
    return resolveTeam(id);
  },

  deleteTeam(id) {
    teams = teams.filter(t => t.id !== id);
    team_individuals = team_individuals.filter(ti => ti.team_id !== id);
    accomplishments = accomplishments.filter(a => a.team_id !== id);
    persist();
    return true;
  },

  // ─── Team Members (TeamIndividual join table) ───────────────────────────────

  addMemberToTeam(team_id, individual_id) {
    const exists = team_individuals.some(
      ti => ti.team_id === team_id && ti.individual_id === individual_id
    );
    if (!exists) {
      team_individuals.push({ id: genId(), team_id, individual_id });
      persist();
    }
    return resolveTeam(team_id);
  },

  removeMemberFromTeam(team_id, individual_id) {
    team_individuals = team_individuals.filter(
      ti => !(ti.team_id === team_id && ti.individual_id === individual_id)
    );
    persist();
    return resolveTeam(team_id);
  },

  getTeamsForIndividual(individual_id) {
    const teamIds = team_individuals
      .filter(ti => ti.individual_id === individual_id)
      .map(ti => ti.team_id);

    // Also include teams where individual is the lead
    teams.forEach(t => {
      if (t.team_lead_id === individual_id && !teamIds.includes(t.id)) {
        teamIds.push(t.id);
      }
    });

    return teamIds.map(resolveTeam).filter(Boolean);
  },

  // ─── Accomplishments ───────────────────────────────────────────────────────

  getAccomplishments(team_id) {
    return accomplishments
      .filter(a => a.team_id === team_id)
      .map(a => ({ ...a }));
  },

  createAccomplishment(team_id, data) {
    const record = { id: genId(), team_id, ...data };
    accomplishments.push(record);
    persist();
    return { ...record };
  },

  updateAccomplishment(id, data) {
    const idx = accomplishments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    accomplishments[idx] = { ...accomplishments[idx], ...data, id };
    persist();
    return { ...accomplishments[idx] };
  },

  deleteAccomplishment(id) {
    accomplishments = accomplishments.filter(a => a.id !== id);
    persist();
    return true;
  },
};
