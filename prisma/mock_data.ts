import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Generating mock data...');

  const users = await prisma.user.findMany({ where: { role: 'user' } });
  const areas = await prisma.area.findMany();

  if (users.length === 0 || areas.length === 0) {
    console.error('Please run the initial seed first (npm run seed)');
    return;
  }

  const now = new Date();
  const bookings = [];

  for (let i = 0; i < 150; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomArea = areas[Math.floor(Math.random() * areas.length)];
    
    // Random date in the last 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const randomHour = Math.floor(Math.random() * 24);
    
    const from = new Date(now);
    from.setDate(now.getDate() - daysAgo);
    from.setHours(randomHour, 0, 0, 0);
    
    const to = new Date(from);
    to.setHours(from.getHours() + 1);

    bookings.push({
      userId: randomUser.id,
      areaId: randomArea.id,
      from,
      to,
      createdAt: from // Sync createdAt for better stats visualization
    });
  }

  await prisma.booking.createMany({ data: bookings });
  console.log('Successfully generated 150 mock bookings.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
