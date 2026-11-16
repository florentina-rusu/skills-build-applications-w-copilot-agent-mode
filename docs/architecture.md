# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep all UI and route behavior in React components that render API data with clear loading, empty, and error states; the browser will call relative `/api` routes and rely on Vite to proxy to the Express service.
- Logic tier decision: Implement the API contract in Express route handlers and service logic, keeping validation, aggregation, and workout recommendation rules in the backend instead of the frontend, and return deliberate 4xx responses for invalid IDs, missing required fields, and unknown users.
- Data tier decision: Define the Mongoose schemas to enforce required fields, relationships, and defaults for users, teams, activities, and workouts, then use an idempotent seed script that preserves existing records and adds representative fixtures without duplicating the seeded data.
- Activity tracking approach: Store user/team refs plus type, minutes, occurredAt, and computed points; reject malformed or missing references before creating activity records, and ensure the created payload matches the API contract.
- Team management approach: Require a name and mascot for team creation, default members to an empty array, and accept team member IDs as valid ObjectId references while keeping member lists exposed on the API response.
- Leaderboard approach: Aggregate each team's total points from activities, sort descending by total, and assign a 1-based rank to each team entry in the returned leaderboard array.
- Workout suggestions approach: Match each user's recent activity pattern to seeded workouts by focus and reason, with a fallback user lookup that returns a 4xx when no matching email exists.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend` — validates Mongoose models and seed idempotency. Failures here indicate missing schema constraints, bad defaults, or seed logic that does not preserve existing data.
- API command: `npm run test:api --prefix octofit-tracker/backend` — validates the Express route contract: invalid payload handling, team/activity creation, leaderboard ordering, and workout recommendation matching. Failures here indicate missing logic or incorrect 4xx behavior in the API layer.
- Frontend command: `npm test --prefix octofit-tracker/frontend` — validates the presentation contract: route rendering, API fetching, loading states, empty states, and accessible alert handling. Failures here indicate the UI is not consuming the API contract correctly.
- Backend build command: `npm run build --prefix octofit-tracker/backend` — checks TypeScript compilation and route/service correctness independent of runtime tests.
- Frontend build command: `npm run build --prefix octofit-tracker/frontend` — checks Vite/React TypeScript compilation and confirms the presentation code still builds after the contract is implemented.
