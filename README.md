# SmartCity backend

## Project Structure

- `prisma/`: Database schema, migrations, and seed scripts.
- `src/`: Source code for the Express API.
- `api-tests.http`: HTTP requests for manual API testing.
- `docker-compose.yml`: Docker configuration for the PostgreSQL database.

## Run instructions (PowerShell):

1. Ensure Postgres is running locally and `DATABASE_URL` in `.env` points to it.
2. Install dependencies: pnpm install
3. Generate Prisma client: pnpm prisma:generate
4. Run migration: pnpm prisma:migrate dev --name init
5. Seed DB: pnpm run seed
6. Set JWT secret and start dev server:
   $env:JWT_SECRET = 'your_jwt_secret'
   pnpm dev

APIs:
- POST /api/auth/login { username, password } -> sets httpOnly cookie and returns { role, userId }
- POST /api/auth/logout -> clears cookie
- GET /api/areas -> protected, returns areas with available spots
- POST /api/areas -> admin only, create area { id, name, capacity }
- POST /api/bookings -> user only, body { areaId } creates 1h booking
- GET /api/bookings/my/:userId -> user or admin
- GET /api/bookings/all -> admin
- GET /api/bookings/stats/30days -> admin