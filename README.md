# SmartCity backend prototype

To run:

- install dependencies: pnpm install
- set environment variable JWT_SECRET
- run: pnpm dev

APIs:
- POST /api/auth/login { username, password }
- POST /api/auth/logout
- GET /api/areas
- POST /api/bookings { userId, areaId }
- GET /api/bookings/my/:userId
- GET /api/bookings/all (admin)

Notes:
- Currently uses in-memory data for prototype; replace with database and Prisma schema connecting to Postgres in production.