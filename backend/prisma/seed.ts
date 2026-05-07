import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      password: adminPassword,
      name: 'Admin',
      role: 'ADMIN',
    },
  });

  console.log(`✅ Seeded successfully!`);
  console.log(`👤 Admin: admin@gmail.com / admin123`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
