import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadLeaderboard() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard');
        if (active) setEntries(result.leaderboard ?? []);
      } catch {
        if (active) setError('Unable to load leaderboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadLeaderboard();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals.">
      {loading ? <p role="status">Loading leaderboard...</p> : null}
      {!loading && error ? <p role="alert">{error}</p> : null}
      {!loading && !error && entries.length === 0 ? <p>No leaderboard.</p> : null}
      {!loading && !error && entries.length > 0 ? (
        <ol className="list-group list-group-numbered">
          {entries.map((entry) => (
            <li key={`${entry.teamName ?? 'team'}-${entry.rank ?? 'rank'}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{entry.teamName ?? 'Unknown team'}</span>
              <span className="badge text-bg-primary rounded-pill">{entry.totalPoints ?? 0}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </CapabilityCard>
  );
}
