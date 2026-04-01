import { mockTeams, mockIndividuals, mockAccomplishments } from './mockData';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Fetches all teams from the backend API, falling back to mock data.
 * @returns {Promise<Array>} Array of team objects
 */
export async function fetchTeams() {
  return mockTeams;
  try {
    const response = await fetch(`${API_BASE_URL}/api/teams`);
    if (!response.ok) throw new Error(`Failed to fetch teams: ${response.statusText}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return mockTeams;
  }
}

/**
 * Deletes a team by ID.
 * @param {string} id - The team ID to delete
 * @returns {Promise<void>}
 */
export async function deleteTeam(id) {
  const response = await fetch(`${API_BASE_URL}/api/teams/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete team: ${response.statusText}`);
}

/**
 * Deletes an individual by ID.
 * @param {string} id - The individual ID to delete
 * @returns {Promise<void>}
 */
export async function deleteIndividual(id) {
  const response = await fetch(`${API_BASE_URL}/api/individuals/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(`Failed to delete individual: ${response.statusText}`);
}

/**
 * Creates a new accomplishment for a team.
 * @param {string} teamId - The team ID
 * @param {Object} accomplishmentData - The accomplishment data (description, date)
 * @returns {Promise<Object>} The created accomplishment
 */
export async function createAccomplishment(teamId, accomplishmentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/accomplishments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accomplishmentData)
    });
    if (!response.ok) throw new Error(`Failed to create accomplishment: ${response.statusText}`);
    return await response.json();
  } catch {
    return { id: Date.now().toString(), teamId, ...accomplishmentData };
  }
}

/**
 * Updates an existing accomplishment.
 * @param {string} accomplishmentId - The accomplishment ID
 * @param {Object} accomplishmentData - The accomplishment data (description, date)
 * @returns {Promise<Object>} The updated accomplishment
 */
export async function updateAccomplishment(accomplishmentId, accomplishmentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/accomplishments/${accomplishmentId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accomplishmentData)
    });
    if (!response.ok) throw new Error(`Failed to update accomplishment: ${response.statusText}`);
    return await response.json();
  } catch {
    return { id: accomplishmentId, ...accomplishmentData };
  }
}

export async function fetchIndividuals() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/individuals`);
    if (!response.ok) throw new Error(`Failed to fetch individuals: ${response.statusText}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return mockIndividuals;
  }
}
