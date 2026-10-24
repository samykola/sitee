# CLIPROOM

**Create. Discover. Share.** — A modern social platform for short creative content.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

## Features

- 🎨 **Feed with smart ranking** — For You / Following / Latest / Trending
- 📸 **TikTok-style camera** — record, flip, torch, 8 filters
- 🔍 **AI detection** — labels AI-generated images automatically (forensic + metadata)
- 💬 **Direct messages** — DMs, groups, voice notes, GIFs
- 📢 **Channels** — personal + themed, subscribers, invite links
- 🎯 **Communities** — join, post, moderate
- 🏆 **Gamification** — XP, levels, streaks, achievements
- 🔐 **Secure auth** — JWT httpOnly, bcrypt, RBAC (USER → SUPER_ADMIN)
- 🛡️ **Full moderation** — reports, admin dashboard, role-based access
- 📱 **Mobile-first** — bottom nav, responsive everywhere

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET

# 3. Setup DB
npx prisma db push
npm run db:seed

# 4. Run
npm run dev
```

Open http://localhost:3000

**Demo login:** `nova@cliprooom.dev` / `password123`

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Vercel / Railway / VPS instructions.

## Stack

- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** (dark-first)
- **Prisma** + PostgreSQL
- **JWT** via jose, **bcrypt** passwords
- **Zod** validation
- **sharp** image processing
- **Media** local → switch to S3-ready

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Run production build |
| `npm run db:push` | Sync schema to DB |
| `npm run db:seed` | Populate demo data |
| `npm run db:reset` | Wipe + reseed (destructive) |
| `npm run check` | Validate env vars |

## Environment Variables

Required:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — at least 32 random chars
- `NEXT_PUBLIC_APP_URL` — public URL (no trailing slash)

Optional:
- `MAX_UPLOAD_MB` — default 25
- `S3_*` — object storage (falls back to local disk)
- `SMTP_*` — real email (falls back to console)

Generate `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## API

- `GET /api/health` — health check
- `GET /sitemap.xml` — sitemap
- `GET /robots.txt` — robots

## License

MIT
