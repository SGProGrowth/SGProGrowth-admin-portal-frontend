# Deploy SG Pro Growth

Two options: **Render** (easiest, free tier) or **Docker on a VPS** (single server).

---

## Option A — Render (recommended)

### 1. Push code to GitHub

The repo root must include `Backend/sg-api`, `Frontend/sg-admin`, and `render.yaml`.

### 2. Create Render Blueprint

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render reads `render.yaml` and creates:
   - **sgpro-db** — PostgreSQL
   - **sg-api** — Node API
   - **sg-admin** — Static React admin

### 3. Set environment variables after first deploy

| Service | Variable | Value |
|---------|----------|--------|
| **sg-api** | `CORS_ORIGIN` | Your admin URL, e.g. `https://sg-admin-xxxx.onrender.com` |
| **sg-admin** | `VITE_API_URL` | Your API URL + `/api`, e.g. `https://sg-api-xxxx.onrender.com/api` |

Redeploy **sg-admin** after setting `VITE_API_URL` (build-time variable).

Copy **JWT_SECRET** from sg-api to sg-admin `VITE_JWT_SECRET` if not linked automatically.

### 4. Login

Default admin (from seed):

- Email: `maheshmd@sharvagroup.com`
- Password: `Growth$108@1610`

Change this in production via **Settings → Admin Users**.

---

## Option B — Docker on VPS

Requires Docker + Docker Compose on the server.

```bash
cp .env.prod.example .env.prod
# Edit .env.prod — set JWT_SECRET and POSTGRES_PASSWORD

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Open `http://YOUR-SERVER-IP` — nginx serves the admin and proxies `/api` to the backend.

---

## Local production test

```powershell
# API
cd Backend\sg-api
npm run build
npm run start:prod

# Frontend (separate terminal)
cd Frontend\sg-admin
npm run build
npm run preview
```

---

## Checklist before go-live

- [ ] Change default admin password
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Set `CORS_ORIGIN` to your real admin domain only
- [ ] Use PostgreSQL (not JSON fallback) in production
- [ ] Enable HTTPS (Render provides this automatically)

---

## URLs after deploy

| App | Local | Production |
|-----|-------|------------|
| Admin | http://localhost:5173 | `https://sg-admin-*.onrender.com` |
| API | http://localhost:4000 | `https://sg-api-*.onrender.com` |
| Health | /api/health | /api/health |
