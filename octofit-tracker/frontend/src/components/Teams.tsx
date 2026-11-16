import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name?: string;
  mascot?: string;
  members?: Array<string | { _id?: string; toString?: () => string }>;
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTeams() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJson<{ teams: TeamRecord[] }>('/api/teams');
        if (active) setTeams(result.teams ?? []);
      } catch {
        if (active) setError('Unable to load teams.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTeams();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members.">
      {loading ? <p role="status">Loading teams...</p> : null}
      {!loading && error ? <p role="alert">{error}</p> : null}
      {!loading && !error && teams.length === 0 ? <p>No teams.</p> : null}
      {!loading && !error && teams.length > 0 ? (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name ?? 'team'}-${index}`} className="list-group-item">
              <strong>{team.name ?? 'Unnamed team'}</strong>
              <div className="small text-muted">Mascot: {team.mascot ?? 'Unknown'}</div>
              <div>{(team.members ?? []).length} member(s)</div>
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
