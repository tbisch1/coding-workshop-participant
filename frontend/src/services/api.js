/**
 * api.js
 *
 * API abstraction layer. Each function attempts the real backend first.
 * On failure it falls back to localDb.js which operates on an in-memory
 * copy of database.json.
 *
 * All functions return objects in the resolved shape (foreign keys
 * replaced with nested objects), regardless of whether the real API
 * or the local fallback was used.
 */

import { localDb } from './localDb';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
}

// ─── Individuals ──────────────────────────────────────────────────────────────

/**
 * Fetches all individuals.
 * @returns {Promise<Array>}
 */
export async function fetchIndividuals() {
  try {
    const data = await apiFetch('/api/individuals');
    return Array.isArray(data) ? data : localDb.getIndividuals();
  } catch {
    return localDb.getIndividuals();
  }
}

/**
 * Fetches a single individual by ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchIndividual(id) {
  try {
    return await apiFetch(`/api/individuals/${id}`);
  } catch {
    return localDb.getIndividual(id);
  }
}

/**
 * Creates a new individual.
 * @param {Object} data - { name, email, password, location, position }
 * @returns {Promise<Object>}
 */
export async function createIndividual(data) {
  try {
    return await apiFetch('/api/individuals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return localDb.createIndividual(data);
  }
}

/**
 * Updates an existing individual.
 * @param {string} id
 * @param {Object} data - { name, email, password, location, position }
 * @returns {Promise<Object>}
 */
export async function updateIndividual(id, data) {
  try {
    return await apiFetch(`/api/individuals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return localDb.updateIndividual(id, data);
  }
}

/**
 * Deletes an individual by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteIndividual(id) {
  try {
    await apiFetch(`/api/individuals/${id}`, { method: 'DELETE' });
  } catch {
    localDb.deleteIndividual(id);
  }
}

// ─── Teams ────────────────────────────────────────────────────────────────────

/**
 * Fetches all teams (with team_lead and members resolved).
 * @returns {Promise<Array>}
 */
export async function fetchTeams() {
  try {
    const data = await apiFetch('/api/teams');
    return Array.isArray(data) ? data : localDb.getTeams();
  } catch {
    return localDb.getTeams();
  }
}

/**
 * Fetches a single team by ID (with team_lead and members resolved).
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchTeam(id) {
  try {
    return await apiFetch(`/api/teams/${id}`);
  } catch {
    return localDb.getTeam(id);
  }
}

/**
 * Creates a new team.
 * @param {Object} data - { name, organization, team_lead_id, member_ids }
 * @returns {Promise<Object>}
 */
export async function createTeam(data) {
  try {
    return await apiFetch('/api/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return localDb.createTeam(data);
  }
}

/**
 * Updates an existing team.
 * @param {string} id
 * @param {Object} data - { name, organization, team_lead_id, member_ids }
 * @returns {Promise<Object>}
 */
export async function updateTeam(id, data) {
  try {
    return await apiFetch(`/api/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return localDb.updateTeam(id, data);
  }
}

/**
 * Deletes a team by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTeam(id) {
  try {
    await apiFetch(`/api/teams/${id}`, { method: 'DELETE' });
  } catch {
    localDb.deleteTeam(id);
  }
}

// ─── Team Members ─────────────────────────────────────────────────────────────

/**
 * Adds an individual to a team (creates a TeamIndividual record).
 * @param {string} team_id
 * @param {string} individual_id
 * @returns {Promise<Object>} The updated team
 */
export async function addMemberToTeam(team_id, individual_id) {
  try {
    return await apiFetch(`/api/teams/${team_id}/members`, {
      method: 'POST',
      body: JSON.stringify({ individual_id }),
    });
  } catch {
    return localDb.addMemberToTeam(team_id, individual_id);
  }
}

/**
 * Removes an individual from a team (deletes the TeamIndividual record).
 * @param {string} team_id
 * @param {string} individual_id
 * @returns {Promise<Object>} The updated team
 */
export async function removeMemberFromTeam(team_id, individual_id) {
  try {
    return await apiFetch(`/api/teams/${team_id}/members/${individual_id}`, {
      method: 'DELETE',
    });
  } catch {
    return localDb.removeMemberFromTeam(team_id, individual_id);
  }
}

/**
 * Fetches all teams an individual belongs to (as lead or member).
 * @param {string} individual_id
 * @returns {Promise<Array>}
 */
export async function fetchTeamsForIndividual(individual_id) {
  try {
    return await apiFetch(`/api/individuals/${individual_id}/teams`);
  } catch {
    return localDb.getTeamsForIndividual(individual_id);
  }
}

// ─── Accomplishments ──────────────────────────────────────────────────────────

/**
 * Fetches all accomplishments for a team.
 * @param {string} team_id
 * @returns {Promise<Array>}
 */
export async function fetchAccomplishments(team_id) {
  try {
    return await apiFetch(`/api/teams/${team_id}/accomplishments`);
  } catch {
    return localDb.getAccomplishments(team_id);
  }
}

/**
 * Creates a new accomplishment for a team.
 * @param {string} team_id
 * @param {Object} data - { description, date }
 * @returns {Promise<Object>}
 */
export async function createAccomplishment(team_id, data) {
  try {
    return await apiFetch(`/api/teams/${team_id}/accomplishments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch {
    return localDb.createAccomplishment(team_id, data);
  }
}

/**
 * Updates an existing accomplishment.
 * @param {string} id
 * @param {Object} data - { description, date }
 * @returns {Promise<Object>}
 */
export async function updateAccomplishment(id, data) {
  try {
    return await apiFetch(`/api/accomplishments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  } catch {
    return localDb.updateAccomplishment(id, data);
  }
}

/**
 * Deletes an accomplishment by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteAccomplishment(id) {
  try {
    await apiFetch(`/api/accomplishments/${id}`, { method: 'DELETE' });
  } catch {
    localDb.deleteAccomplishment(id);
  }
}
