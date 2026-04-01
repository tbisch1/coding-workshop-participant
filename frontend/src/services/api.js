const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

/**
 * Fetches all teams from the backend API.
 * @returns {Promise<Array>} Array of team objects
 */
export async function fetchTeams() {
  const response = await fetch(`${API_BASE_URL}/api/teams`);
  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.statusText}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Fetches all individuals from the backend API.
 * @returns {Promise<Array>} Array of individual objects
 */
export async function fetchIndividuals() {
  const response = await fetch(`${API_BASE_URL}/api/individuals`);
  if (!response.ok) {
    throw new Error(`Failed to fetch individuals: ${response.statusText}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}
