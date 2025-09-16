# Chat-room

A small Vite + React + TypeScript chat app using Supabase.

## Requirements

- Node.js 18+ (or a recent LTS)
- npm
- A Supabase project (for the database and auth)

## Setup

1. Clone the repository

```bash
git clone https://github.com/Shreyasc0de/Chat-room.git
cd Chat-room
```

2. Install dependencies

```bash
npm install
```

3. Create a Supabase project and copy the project URL and anon key.

4. Create a `.env` file in the project root with the following entries (Vite reads `import.meta.env` from `VITE_` prefixed vars):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. (Optional) Run the SQL migration in `supabase/migrations` on your Supabase project if needed.

## Run

Start the dev server:

```bash
npm run dev
```

Open the app at `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Lint

```bash
npm run lint
```

## Notes

- The project uses Supabase Auth; ensure you have the appropriate auth configuration in your Supabase dashboard.
- Database tables expected: `chat_rooms` with a default for `created_by` and relevant columns used in the app.

If you'd like, I can add a `.env.example`, CI workflow, or a step to automatically run migrations against Supabase.