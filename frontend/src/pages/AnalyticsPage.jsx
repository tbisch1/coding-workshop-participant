import { useState, useEffect } from 'react';
import { fetchTeams, fetchIndividuals, fetchAccomplishments } from '../services/api';
import './AnalyticsPage.css';

/**
 * Analytics Page component with various team and organization metrics.
 */
function AnalyticsPage() {
  const [teams, setTeams] = useState([]);
  const [individuals, setIndividuals] = useState([]);
  const [accomplishments, setAccomplishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    metrics: true,
    composition: true,
    locations: true,
    leadership: true,
    achievements: true,
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [teamsData, individualsData] = await Promise.all([
          fetchTeams(),
          fetchIndividuals(),
        ]);
        setTeams(teamsData);
        setIndividuals(individualsData);

        // Fetch accomplishments for all teams
        const allAccomplishments = [];
        for (const team of teamsData) {
          const accs = await fetchAccomplishments(team.id);
          allAccomplishments.push(...accs);
        }
        setAccomplishments(allAccomplishments);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="analytics-page">
        <h1>Analytics</h1>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <h1>Analytics</h1>
        <p style={{ color: '#ef4444' }}>Error: {error}</p>
      </div>
    );
  }

  // ─── Computed Analytics ──────────────────────────────────────────────────────

  // 1. Team Composition - members of each team
  const teamComposition = teams.map((team) => ({
    ...team,
    memberCount: team.members ? team.members.length : 0,
    members: team.members || [],
    leadName: team.team_lead?.name || 'Unknown',
  }));

  // 2. Teams with non-co-located leaders
  const nonColocatedLeaderTeams = teams.filter((team) => {
    const lead = team.team_lead;
    if (!lead) return false;
    const nonColocated = team.members?.some((member) => member.location !== lead.location) ?? false;
    return nonColocated;
  });

  // 3. Leadership position analysis
  const leaderPositionAnalysis = teams.map((team) => ({
    teamName: team.name,
    leaderName: team.team_lead?.name || 'Unknown',
    leaderPosition: team.team_lead?.position || 'Unknown',
    isEmployee: team.team_lead?.position === 'Employee',
  }));

  const nonDirectLeaders = leaderPositionAnalysis.filter((item) => item.isEmployee);

  // 4. Monthly achievements
  const monthlyAchievements = {};
  accomplishments.forEach((acc) => {
    const date = new Date(acc.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthlyAchievements[monthKey]) {
      monthlyAchievements[monthKey] = [];
    }
    monthlyAchievements[monthKey].push(acc);
  });

  const sortedMonths = Object.keys(monthlyAchievements).sort().reverse();

  // 5. Team locations
  const teamLocations = teams.map((team) => {
    const locations = new Set();
    if (team.team_lead?.location) {
      locations.add(team.team_lead.location);
    }
    team.members?.forEach((member) => {
      if (member.location) {
        locations.add(member.location);
      }
    });
    return {
      teamName: team.name,
      locations: Array.from(locations),
      isDistributed: locations.size > 1,
    };
  });

  return (
    <div className="analytics-page">
      <header className="analytics-header">
        <h1 className="analytics-title">Analytics Dashboard</h1>
        <p className="analytics-subtitle">Team and organization metrics</p>
      </header>

      <main className="analytics-main">
        {/* Section 1: Key Metrics */}
        <section className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Key Metrics</h2>
            <button
              className="section-toggle"
              onClick={() => toggleSection('metrics')}
              aria-expanded={expandedSections.metrics}
            >
              {expandedSections.metrics ? '−' : '+'}
            </button>
          </div>
          {expandedSections.metrics && (
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{teams.length}</div>
                <div className="metric-label">Total Teams</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{individuals.length}</div>
                <div className="metric-label">Total Individuals</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{accomplishments.length}</div>
                <div className="metric-label">Total Accomplishments</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{nonColocatedLeaderTeams.length}</div>
                <div className="metric-label">Teams with Non-Co-located Leaders</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{nonDirectLeaders.length}</div>
                <div className="metric-label">Teams with Employee Leaders</div>
              </div>
            </div>
          )}
        </section>

        {/* Section 2: Team Composition */}
        <section className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Team Composition</h2>
            <button
              className="section-toggle"
              onClick={() => toggleSection('composition')}
              aria-expanded={expandedSections.composition}
            >
              {expandedSections.composition ? '−' : '+'}
            </button>
          </div>
          {expandedSections.composition && (
            <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Organization</th>
                  <th>Team Lead</th>
                  <th>Members</th>
                  <th>Total Size</th>
                </tr>
              </thead>
              <tbody>
                {teamComposition.map((team) => (
                  <tr key={team.id}>
                    <td>{team.name}</td>
                    <td>{team.organization}</td>
                    <td>{team.leadName}</td>
                    <td>
                      {team.members.length > 0 ? (
                        <ul className="member-list">
                          {team.members.map((member) => (
                            <li key={member.id}>{member.name}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="empty-value">—</span>
                      )}
                    </td>
                    <td>{team.memberCount + 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        {/* Section 3: Team Locations */}
        <section className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Team Locations</h2>
            <button
              className="section-toggle"
              onClick={() => toggleSection('locations')}
              aria-expanded={expandedSections.locations}
            >
              {expandedSections.locations ? '−' : '+'}
            </button>
          </div>
          {expandedSections.locations && (
            <div className="table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Locations</th>
                  <th>Distributed</th>
                </tr>
              </thead>
              <tbody>
                {teamLocations.map((team, idx) => (
                  <tr key={idx}>
                    <td>{team.teamName}</td>
                    <td>
                      {team.locations.length > 0 ? (
                        team.locations.join(', ')
                      ) : (
                        <span className="empty-value">No location data</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge--${team.isDistributed ? 'distributed' : 'colocated'}`}>
                        {team.isDistributed ? 'Distributed' : 'Co-located'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        {/* Section 4: Leadership Analysis */}
        <section className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Leadership Position Analysis</h2>
            <button
              className="section-toggle"
              onClick={() => toggleSection('leadership')}
              aria-expanded={expandedSections.leadership}
            >
              {expandedSections.leadership ? '−' : '+'}
            </button>
          </div>
          {expandedSections.leadership && (
            <>
              <div className="table-wrapper">
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Leader Name</th>
                      <th>Position</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderPositionAnalysis.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.teamName}</td>
                        <td>{item.leaderName}</td>
                        <td>{item.leaderPosition}</td>
                        <td>
                          <span className={`badge badge--${item.isEmployee ? 'employee' : 'admin'}`}>
                            {item.isEmployee ? 'Employee' : 'Admin'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="section-note">
                {nonDirectLeaders.length} team(s) have employee leaders.
              </p>
            </>
          )}
        </section>

        {/* Section 5: Monthly Achievements */}
        <section className="analytics-section">
          <div className="section-header">
            <h2 className="section-title">Key Achievements by Month</h2>
            <button
              className="section-toggle"
              onClick={() => toggleSection('achievements')}
              aria-expanded={expandedSections.achievements}
            >
              {expandedSections.achievements ? '−' : '+'}
            </button>
          </div>
          {expandedSections.achievements && (
            <>
              {sortedMonths.length === 0 ? (
                <p className="empty-value" style={{ marginTop: '1rem' }}>No accomplishments recorded yet.</p>
              ) : (
                sortedMonths.map((month) => (
                  <div key={month} className="month-group">
                    <h3 className="month-title">{new Date(`${month}-01`).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</h3>
                    <ul className="accomplishments-list">
                      {monthlyAchievements[month].map((acc, idx) => (
                        <li key={idx} className="accomplishment-item">
                          <div className="accomplishment-date">{new Date(acc.date).toLocaleDateString()}</div>
                          <div className="accomplishment-description">{acc.description}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default AnalyticsPage;
