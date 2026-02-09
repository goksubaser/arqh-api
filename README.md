# TS - Fastify - Mongoose Boilerplate

Monorepo with TypeScript + Fastify + Mongoose backend and Next.js frontend.

## Structure

```
├── apps/
│   ├── api/     # Fastify backend
│   └── web/     # Next.js frontend
├── package.json # Root with npm workspaces
└── ...
```

## Setup

1. Install dependencies (from root):
```bash
npm install
```

2. Set environment variables for the API:
Create a file named `development.env` in `apps/api/` with your development environment variables. For example:

```
DB_URL=mongodb://localhost:27017,localhost:27018,localhost:27019/[db-name]
```

## Development

Run individually:
```bash
npm run dev:api   # Backend only (http://localhost:5052)
npm run dev:web   # Frontend only (http://localhost:3000)
```

## Production

```bash
npm run build
npm run start:api
npm run start:web
```
