# 🚀 Quick Start — Nexzee Backend + Preview

Get the backend running **in 5 minutes** with login working.

## One-Command Setup (macOS/Linux)

```bash
git clone https://github.com/nickynacky200-cyber/nexzee-phase6.git
cd nexzee-phase6
bash setup.sh
```

**Done!** Backend runs at `http://localhost:4000` ✅

---

## Manual Setup (if bash script doesn't work)

### 1. Start PostgreSQL
```bash
docker compose up -d
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and replace:
```env
JWT_SECRET=super-secret-key-12345678901234567890
```

### 3. Initialize Database
```bash
npm run prisma:migrate
```

### 4. Start Backend
```bash
npm run dev
```

✅ Running at `http://localhost:4000`

---

## Test Login

```bash
# Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "email": "test@nexzee.com",
    "phone": "08012345678",
    "password": "Password123!"
  }'

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@nexzee.com",
    "password": "Password123!"
  }'
```

You'll get back a JWT token. Copy it for authenticated requests.

---

## Frontend Preview

In a new terminal:

```bash
cd apps/web
npm install
npm run dev
```

Opens at `http://localhost:5173`

---

## Troubleshooting

**Port 5432 already in use?**
```bash
docker compose down
# Then change docker-compose.yml port to 5433
docker compose up -d
# Update DATABASE_URL in .env to port 5433
```

**"DATABASE_URL not set"?**
- Make sure `.env` is in the `backend/` directory, not root

**Tables not created?**
```bash
cd backend
npm run prisma:migrate
```

---

## What's Next?

- Backend API docs: Check `src/routes/` for all endpoints
- Frontend: Mock auth pages ready to connect to real backend
- Wallet & Orders: Phase 4/5 endpoints available in backend

🎉 Ready to roll!
