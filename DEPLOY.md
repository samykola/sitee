# 🚀 Deploying CLIPROOM

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Neon/Railway/Supabase account)
- Vercel account (or similar host)

---

## Option A — Vercel + Neon (Recommended, free)

### 1. Create database at Neon

1. Sign up at https://neon.tech (free tier)
2. Create project → copy **Connection String**
3. It looks like: `postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require`

### 2. Push code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOU/cliprooom.git
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repo
3. **Environment Variables** — add:

   ```
   DATABASE_URL         = postgresql://...neon.tech/neondb?sslmode=require
   JWT_SECRET           = <generate with the command below>
   NEXT_PUBLIC_APP_URL  = https://your-project.vercel.app
   MAX_UPLOAD_MB        = 25
   ```

   Generate `JWT_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

4. Click **Deploy**

### 4. First migration + seed

After first deploy, run from your local machine:

```bash
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npx prisma db push
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run db:seed
```

Or use Vercel CLI:

```bash
npm i -g vercel
vercel env pull .env.production
npx prisma db push
npm run db:seed
```

### 5. Verify

Visit: `https://your-project.vercel.app/api/health`

Should return:
```json
{ "status": "healthy", "checks": { "database": "ok", ... } }
```

---

## Option B — Railway (all-in-one)

1. Go to https://railway.app/new
2. **Deploy from GitHub repo**
3. Add PostgreSQL plugin (Railway auto-sets `DATABASE_URL`)
4. Add env vars: `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`
5. Deploy

Then locally:
```bash
railway link
railway run npx prisma db push
railway run npm run db:seed
```

---

## Option C — VPS (DigitalOcean, Hetzner)

```bash
# On your server
git clone https://github.com/YOU/cliprooom.git
cd cliprooom
npm ci
cp .env.example .env
# Edit .env with your values
npx prisma db push
npm run db:seed
npm run build
npm start
```

Use **PM2** for process management:

```bash
npm i -g pm2
pm2 start npm --name cliprooom -- start
pm2 save
pm2 startup
```

Put **Nginx** in front with SSL via Let's Encrypt:

```nginx
server {
    listen 443 ssl http2;
    server_name cliprooom.com;
    client_max_body_size 30M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Production Checklist

### Before deploy

- [ ] `npm run build` succeeds locally
- [ ] `node scripts/check-env.js` passes
- [ ] `JWT_SECRET` is at least 32 random hex chars (generate with the command above)
- [ ] `NEXT_PUBLIC_APP_URL` is `https://...` (not `http://`)
- [ ] Database has SSL (`?sslmode=require` in URL)
- [ ] `.env` is **NOT** committed to git

### After deploy

- [ ] `/api/health` returns `healthy`
- [ ] Can register + login
- [ ] Can upload image (verify `/uploads/` works or S3 configured)
- [ ] Can post + view feed
- [ ] AI detection works (upload test image, check console)
- [ ] HTTPS works
- [ ] Test on mobile

---

## Optional upgrades

### Real email (verification + password reset)

Add SMTP to `.env`:

```
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="CLIPROOM <noreply@cliprooom.com>"
```

For Gmail: enable 2FA, then create app password at https://myaccount.google.com/apppasswords

### S3-compatible storage (Cloudflare R2, Backblaze B2)

**Why:** Vercel filesystem is ephemeral. Images uploaded locally are lost on redeploy.

**Free tiers:**
- Cloudflare R2 — 10GB free + free egress
- Backblaze B2 — 10GB free
- Supabase Storage — 1GB free

Set env vars:

```
S3_ENDPOINT="https://xxx.r2.cloudflarestorage.com"
S3_REGION="auto"
S3_BUCKET="cliprooom-media"
S3_ACCESS_KEY="..."
S3_SECRET_KEY="..."
S3_PUBLIC_URL="https://cdn.cliprooom.com"
```

See `src/lib/storage.ts` for the adapter implementation.

### Custom domain

In Vercel: **Settings → Domains → Add** → follow DNS instructions

Then update `NEXT_PUBLIC_APP_URL` and redeploy.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `P1001 Can't reach database` | Check `DATABASE_URL` and SSL mode |
| `JWT_SECRET is missing` | Add env var in Vercel dashboard |
| Uploads disappear on redeploy | Setup S3 (see above) |
| Build fails | Run `npm run build` locally first |
| Slow first request | Normal on cold start — keep-alive via `/api/health` |

---

## Support

- GitHub Issues
- Docs: `/README.md`
