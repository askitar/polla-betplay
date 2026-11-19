# La Polla BetPlay

A prediction game ("polla") for Colombia's top football league, the Liga BetPlay. Friends or coworkers create a private club, everyone predicts the score of each match, and the app keeps the standings.

**Live:** https://www.pollabetplay.com

## What problem it solves

Office and family prediction pools usually live in a spreadsheet or a WhatsApp group: someone has to collect predictions, check deadlines, type results and recalculate the table. This app does all of that, fairly and automatically.

## Features

- **Private clubs with invite codes.** One account can join several clubs; a prediction counts in every club you belong to.
- **Passwordless sign-in** with a magic link sent by email.
- **Fair deadlines enforced on the server.** Predictions close 10 minutes before kickoff, and other players' picks are revealed only when the match starts. The server clock decides, never the browser.
- **Automatic results and standings.** Scheduled jobs sync fixtures and live scores from sports data APIs; the scoring engine updates every club's table.
- **Manual override for admins.** A result entered by hand is frozen, so a later sync can never overwrite it.
- **Operational alerts by email** when a data provider fails, its daily quota runs out, the database is down, or a match looks stuck in "live".
- **Daily digest email** for players.
- Schedule, standings, match list, profile and club views.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · PostgreSQL with Prisma 7 · Auth.js v5 (magic link) · Resend (email) · Upstash QStash (scheduled jobs) · API-Football and Highlightly (sports data) · Zod · Vercel

## Run it locally

```bash
npm install
cp .env.example .env        # then fill in your own values
npx prisma dev              # local Postgres, keep it running in another terminal
npm run dev                 # http://localhost:3000
```

All configuration lives in environment variables; see [`.env.example`](.env.example) for the full list. No keys are stored in the code.

Useful scripts in `scripts/`:

- `dev-login.ts <email> <name>`: creates a test user and session without sending an email.
- `find-league.ts`: asks the sports API for the real league ID before you configure it.
- `test-scoring.ts`, `test-sync.ts`: check the scoring rules and the results sync.

Unit tests for scoring, ranking, playoffs, seasons and match times live next to the code in `lib/*.test.ts`.

## Architecture notes

- Matches, rounds, teams and results are **global** (there is one real league); clubs are just membership plus an invite code.
- One prediction per user per match, shared across all of that user's clubs.
- Cron and admin routes are protected by signed QStash requests or a shared secret header.

## License

[MIT](LICENSE)
