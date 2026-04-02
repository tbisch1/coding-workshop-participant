/**
 * api.js
 *
 * API abstraction layer that uses localDb.js exclusively.
 * All functions operate on an in-memory copy of database.json persisted to localStorage.
 *
 * All functions return objects in the resolved shape (foreign keys
 * replaced with nested objects).
 */

import { localDb } from './localDb';

// ─── Individuals ──────────────────────────────────────────────────────────────

/**
 * Fetches all individuals.
 * @returns {Promise<Array>}
 */
export async function fetchIndividuals() {
  return localDb.getIndividuals();
}

/**
 * Fetches a single individual by ID.
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchIndividual(id) {
  return localDb.getIndividual(id);
}

/**
 * Creates a new individual.
 * @param {Object} data - { name, email, password, location, position }
 * @returns {Promise<Object>}
 */
export async function createIndividual(data) {
  return localDb.createIndividual(data);
}

/**
 * Updates an existing individual.
 * @param {string} id
 * @param {Object} data - { name, email, password, location, position }
 * @returns {Promise<Object>}
 */
export async function updateIndividual(id, data) {
  return localDb.updateIndividual(id, data);
}

/**
 * Deletes an individual by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteIndividual(id) {
  return localDb.deleteIndividual(id);
}

// ─── Teams ────────────────────────────────────────────────────────────────────

/**
 * Fetches all teams (with team_lead and members resolved).
 * @returns {Promise<Array>}
 */
export async function fetchTeams() {
  return localDb.getTeams();
}

/**
 * Fetches a single team by ID (with team_lead and members resolved).
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchTeam(id) {
  return localDb.getTeam(id);
}

/**
 * Creates a new team.
 * @param {Object} data - { name, organization, team_lead_id, member_ids }
 * @returns {Promise<Object>}
 */
export async function createTeam(data) {
  return localDb.createTeam(data);
}

/**
 * Updates an existing team.
 * @param {string} id
 * @param {Object} data - { name, organization, team_lead_id, member_ids }
 * @returns {Promise<Object>}
 */
export async function updateTeam(id, data) {
  return localDb.updateTeam(id, data);
}

/**
 * Deletes a team by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTeam(id) {
  return localDb.deleteTeam(id);
}

// ─── Team Members ─────────────────────────────────────────────────────────────

/**
 * Adds an individual to a team (creates a TeamIndividual record).
 * @param {string} team_id
 * @param {string} individual_id
 * @returns {Promise<Object>} The updated team
 */
export async function addMemberToTeam(team_id, individual_id) {
  return localDb.addMemberToTeam(team_id, individual_id);
}

/**
 * Removes an individual from a team (deletes the TeamIndividual record).
 * @param {string} team_id
 * @param {string} individual_id
 * @returns {Promise<Object>} The updated team
 */
export async function removeMemberFromTeam(team_id, individual_id) {
  return localDb.removeMemberFromTeam(team_id, individual_id);
}

/**
 * Fetches all teams an individual belongs to (as lead or member).
 * @param {string} individual_id
 * @returns {Promise<Array>}
 */
export async function fetchTeamsForIndividual(individual_id) {
  return localDb.getTeamsForIndividual(individual_id);
}

// ─── Accomplishments ──────────────────────────────────────────────────────────

/**
 * Fetches all accomplishments for a team.
 * @param {string} team_id
 * @returns {Promise<Array>}
 */
export async function fetchAccomplishments(team_id) {
  return localDb.getAccomplishments(team_id);
}

/**
 * Creates a new accomplishment for a team.
 * @param {string} team_id
 * @param {Object} data - { description, date }
 * @returns {Promise<Object>}
 */
export async function createAccomplishment(team_id, data) {
  return localDb.createAccomplishment(team_id, data);
}

/**
 * Updates an existing accomplishment.
 * @param {string} id
 * @param {Object} data - { description, date }
 * @returns {Promise<Object>}
 */
export async function updateAccomplishment(id, data) {
  return localDb.updateAccomplishment(id, data);
}

/**
 * Deletes an accomplishment by ID.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteAccomplishment(id) {
  return localDb.deleteAccomplishment(id);
}
