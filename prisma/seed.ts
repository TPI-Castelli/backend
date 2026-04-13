import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(){
  await prisma.booking.deleteMany();
  await prisma.area.deleteMany();
  await prisma.user.deleteMany();

  const passwordUser = await bcrypt.hash('password1', 10);
  const passwordAdmin = await bcrypt.hash('adminpass', 10);

  const user = await prisma.user.create({ data: { username: 'user1', password: passwordUser, role: 'user' } });
  const admin = await prisma.user.create({ data: { username: 'admin', password: passwordAdmin, role: 'admin' } });

  await prisma.area.createMany({ data: [
    { id: 'A1', name: 'Centro', capacity: 50 },
    { id: 'B2', name: 'Stazione', capacity: 30 }
  ]});

  // create a sample booking in the past 2 days
  const now = new Date();
  const from = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const to = new Date(from.getTime() + 60 * 60 * 1000);
  await prisma.booking.create({ data: { userId: user.id, areaId: 'A1', from, to }});

  console.log('Seed completed');
}

main().catch(e=>{ console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());
