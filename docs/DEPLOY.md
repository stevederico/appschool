# Deployment

AppSchool deploys as one container: the Vite `dist/` frontend and the zero-crate Rust backend behind a single port. Any host that runs a Docker image works. Nothing here is specific to one provider.

## Build and run

```bash
docker build -t appschool .
docker run -p 8000:8000 \
  -e JWT_SECRET=your-long-random-secret \
  -e STRIPE_KEY=sk_live_... \
  -e STRIPE_ENDPOINT_SECRET=whsec_... \
  -e CORS_ORIGINS=https://yourdomain.com \
  -e FRONTEND_URL=https://yourdomain.com \
  -v appschool-data:/app/backend/databases \
  appschool
```

The app listens on `http://localhost:8000`. The image sets `NODE_ENV=production`.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Long random string. Production start refuses a missing, short, or placeholder value |
| `STRIPE_KEY` | For payments | Stripe secret or restricted key |
| `STRIPE_ENDPOINT_SECRET` | For payments | Webhook signing secret (`whsec_...`) |
| `CORS_ORIGINS` | Yes | Comma-separated list of allowed browser origins |
| `FRONTEND_URL` | Yes | Public URL used for checkout and portal redirects |
| `PORT` | No | Listen port, default `8000` |
| `TRUST_PROXY` | No | Number of trusted reverse proxies in front of the process (`1` for a single proxy). Leave unset when exposed directly |
| `FREE_USAGE_LIMIT` | No | Monthly usage limit for free users, default `20` |
| `XAI_API_KEY` | No | Server-only key that mints ephemeral voice tokens at `POST /api/xai/token` |

Never commit `backend/.env`. The Docker build aborts if an `.env` file is in the build context.

## Database

SQLite lives at `backend/databases/AppSchool.db` inside the container. Mount a persistent volume at `/app/backend/databases`.

- On first start, if the volume has no database, the image copies its seed database (the courses, guides, and quizzes) into it.
- After that the volume database is the source of truth. Rebuilding the image does not change it, so course content changes need to be applied to the volume database.
- Back up the volume before upgrading.

## Health check

```bash
curl -fsS http://localhost:8000/api/health
```

The image runs this check every 30 seconds.

## Stripe webhook

1. Open the Stripe dashboard, go to **Developers**, then **Webhooks**, then **Add endpoint**.
2. Set the URL to `https://yourdomain.com/api/payment`.
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the signing secret into `STRIPE_ENDPOINT_SECRET`.

## Scaling

CSRF tokens, sign-in lockouts, and the auth rate limiter live in process memory, which is fine for one instance. With several instances, each one counts separately, so the effective auth rate limit is the per-instance limit times the instance count.
