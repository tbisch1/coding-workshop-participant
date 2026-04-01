import { mockTeams, mockIndividuals } from './mockData';

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
 * Fetches all individuals from the backend API, falling back to mock data.
 * @returns {Promise<Array>} Array of individual objects
 */
export async function fetchIndividuals() {
    return mockIndividuals;
  try {
    const response = await fetch(`${API_BASE_URL}/api/individuals`);
    if (!response.ok) throw new Error(`Failed to fetch individuals: ${response.statusText}`);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return mockIndividuals;
  }
}
