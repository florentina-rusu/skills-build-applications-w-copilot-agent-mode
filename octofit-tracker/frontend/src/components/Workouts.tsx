import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title?: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSuggestions() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com');
        if (active) setSuggestions(result.suggestions ?? []);
      } catch {
        if (active) setError('Unable to load workout suggestions.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadSuggestions();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">
      {loading ? <p role="status">Loading workout suggestions...</p> : null}
      {!loading && error ? <p role="alert">{error}</p> : null}
      {!loading && !error && suggestions.length === 0 ? <p>No workout suggestions.</p> : null}
      {!loading && !error && suggestions.length > 0 ? (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title ?? 'workout'}-${index}`} className="list-group-item">
              <strong>{suggestion.title ?? 'Workout'}</strong>
              <div className="small text-muted">Focus: {suggestion.focus ?? 'general'}</div>
              <div>{suggestion.reason ?? 'Recommended based on recent activity.'}</div>
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
