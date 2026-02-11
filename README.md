# Arqh Case

Dispatch logistics app: Redis for hot state, MongoDB for durable state. Monorepo with Fastify API, Next.js frontend, and a background worker.

## Structure

```
├── apps/
│   ├── api/       # Fastify backend (port 5052)
│   ├── web/       # Next.js frontend (port 3000)
│   └── worker/    # Background tasks (save, optimize)
├── packages/
│   ├── types/     # Shared TypeScript types & Redis keys
│   └── db/        # Mongoose models
├── data/          # Seed data (vehicles, orders, solution)
└── package.json  # Root with npm workspaces
```

## Requirements

- Node.js 20+
- MongoDB (local or Docker)
- Redis (local or Docker)

## Setup

1. Install dependencies (from root):

```bash
npm install
```

2. Create environment files:

**`apps/api/development.env`**

```
DB_URL=mongodb://localhost:27017/app
REDIS_URL=redis://localhost:6379
WEB_URL=http://localhost:3000
```

**`apps/worker/development.env`**

```
DB_URL=mongodb://localhost:27017/app
REDIS_URL=redis://localhost:6379
```

**`apps/web/.env`**

```
API_URL=http://localhost:5052
```

## Development

Start MongoDB and Redis (via Docker):

```bash
npm run docker:db
```

Run apps individually:

```bash
npm run dev:api     # Backend (http://localhost:5052)
npm run dev:web     # Frontend (http://localhost:3000)
npm run dev:worker  # Background worker
```

## Docker (full stack)

Run all services with Docker Compose:

```bash
npm run docker
```

| Service  | URL                  |
|----------|----------------------|
| Web      | http://localhost:3000 |
| API      | http://localhost:5052 |
| MongoDB  | localhost:27017      |
| Redis    | localhost:6379       |

## Production

```bash
npm run build
npm run start:api
npm run start:web
npm run start:worker
```

## Features

- **Orders & Vehicles**: CRUD with soft delete; optimistic UI
- **Assign**: Drag-and-drop orders to vehicles
- **Optimize**: Single-vehicle route optimization (mock shuffle)
- **Save**: Persist Redis state to MongoDB via worker
- **Hydrate**: Load MongoDB state into Redis on startup and sessionStorage token renewal

## Limitations

- **SSE (Server-Sent Events) Scalability**: The frontend currently uses SSE to listen for optimization results and other updates from the backend. With the present implementation, each time a user refreshes the web application, a new SSE connection is created without immediately closing previous connections. Browsers and underlying services (like Node.js/Express) have a default maximum number of concurrent open connections per client (typically around 6). If a user rapidly refreshes the page multiple times (e.g., more than 6 times in quick succession), this limit can be reached, resulting in the backend no longer being able to push events, and the app appears unresponsive. 

  While this limitation should not affect normal usage, it's important to be aware of in development or heavy-use scenarios. One possible way to avoid this would be to use HTTP Polling instead of SSE. However, polling would introduce unnecessary network overhead since most events (such as optimization completions) are triggered by direct user actions (e.g., pressing the "optimize" button), after which only one result is expected. Thus, SSE remains a more efficient choice for this specific workflow, despite some edge-case connection limitations.

- **Frontend sessionStorage**: A token is stored in sessionStorage for each browser session, allowing the app to preserve unsaved project state after accidental page refreshes. However, if the app is opened in a new tab or browser, hydration occurs again and any cached changes are lost. This design strikes a balance between resilience during refreshes and expected behavior across new sessions, fitting the requirements of this case.

- **Optimize Button**: When the optimize button is pressed, it initiates a background optimization process. This typically takes a few seconds, after which a Server-Sent Event (SSE) triggers the UI to update and display the newly optimized route.

- **Backend – MongoDB**: The backend interacts directly with MongoDB only during the hydration process; all other UI changes are first cached in Redis. This means that changes made in the app are not instantly persisted to MongoDB. To ensure changes are saved permanently (especially after sessionStorage is cleared or expired), you must use the "Save Plan" button, which triggers a background process that can take a few seconds to complete. Be aware that because the background worker reads data from Redis, if a new frontend session rehydrates Redis from MongoDB, it can accidentally overwrite recently cached changes with older data from the database. In this scenario, the background worker might pick up and save out-of-date state to MongoDB, resulting in a loss of unsaved recent changes.