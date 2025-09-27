### Start

- install dependencies: `bun install`
- if you don't have ngrok, install it with `brew install ngrok`
- run in two terminals:

```bash
# Terminal A
bun run dev:ngrok

# Terminal B
bun run dev
```

The app runs at `http://localhost:3000`. The public tunnel will be printed by the ngrok process.

app entrypoint code is in `src/app/home.tsx`.

### Database Setup

This project uses SQLite with Drizzle ORM. The database will be automatically created when you first run the app.

#### Quick Setup (Development)
The database will work out of the box with default settings for development. No additional setup required!

#### Manual Database Operations
```bash
# Generate database migrations from schema changes
bun run db:generate

# Apply migrations to the database
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio
```

#### Environment Variables (Optional)
Create a `.env.local` file in the root directory if you want to customize database settings:

```bash
# Database path (optional, defaults to ./.data/sqlite.db)
DATABASE_URL="sqlite://./custom-path.db"

# JWT secret for authentication (optional, defaults to 'dev-secret' in development)
JWT_SECRET="your-secret-key"

# Worldcoin integration (optional)
NEXT_PUBLIC_PUBLISHABLE_KEY="your-worldcoin-publishable-key"

# Enable mock authentication for testing (optional)
NEXT_PUBLIC_MOCK_AUTH="true"
```

#### Database Schema
The current schema includes:
- `users` table with wallet address, username, and profile picture URL

### How to test

1. Open `src/app/login/page.tsx` in your editor.
2. With the dev server running, open `http://localhost:3000`.
3. Find `<div className="h-20 w-20 bg-red-500">` and change `bg-red-500` to `bg-green-500`.
4. You should see HMR instantly update the color in the browser.
5. Open the public ngrok URL (from Terminal A). You may notice HMR does not reflect the change over ngrok.

---

If you want to use AI to translate the messages, you can run `bun run i18n:translate`.

But you need to have `OPENAI_API_KEY` set in your environment variables.


how to pay:
https://docs.world.org/mini-apps/commands/pay
