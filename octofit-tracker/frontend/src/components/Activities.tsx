import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  id?: string;
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadActivities() {
      setLoading(true);
      setError(null);
      try {
        const result = await getJson<{ activities: ActivityRecord[] }>('/api/activities');
        if (active) setActivities(result.activities ?? []);
      } catch {
        if (active) setError('Unable to load activities.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadActivities();
    return () => {
      active = false;
    };
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points.">
      {loading ? <p role="status">Loading activities...</p> : null}
      {!loading && error ? <p role="alert">{error}</p> : null}
      {!loading && !error && activities.length === 0 ? <p>No activities.</p> : null}
      {!loading && !error && activities.length > 0 ? (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type ?? 'activity'}-${index}`} className="list-group-item">
              {activity.type ?? 'Activity'} • {activity.minutes ?? 0} minutes • {activity.points ?? 0} points
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
