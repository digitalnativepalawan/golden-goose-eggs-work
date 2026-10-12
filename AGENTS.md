# SANVIC

San Vicente, Palawan travel hub.

## Stack
- React 19 + TanStack Start (file-based routing in `src/routes`)
- Vite 8, TypeScript, Tailwind CSS
- Supabase (Postgres + Auth + Storage)
- Leaflet + OpenStreetMap for the map, Recharts for charts

## Local development
```bash
npm install
cp .env.example .env   # already points at the current Supabase project
npm run dev
```

## Configuration
`.env` is git-ignored. `.env.example` is committed and contains only
public values (project id, URL, publishable key) — these are safe to publish
and are embedded in the client bundle at build time.

Never commit a secret key or the database password.

## Database
The source of truth for the current schema is the PostgreSQL dump, not the
files in `supabase/migrations`. Those migrations are historical and are not
guaranteed to replay cleanly against a fresh project.

## Storage
Image and video binaries live in Supabase Storage buckets and are **not**
included in a database dump. A dump restores only the rows that point at
them, so media must be re-uploaded after a migration.
