import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from 'src/database/generated/prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const saltRounds = 10;

const main = async () => {
  await prisma.user.createMany({
    data: [
      {
        email: 'superadmin@gmail.com',
        password: await bcrypt.hash('admin123', saltRounds),
        role: Role.SUPER_ADMIN,
        gender: 'OTHER',
      },
      {
        email: 'zuper@gmail.com',
        password: await bcrypt.hash('admin123', saltRounds),
        role: Role.SUPER_ADMIN,
        gender: 'OTHER',
      },
    ],
  });
};
main().catch((error) => console.log(error));
