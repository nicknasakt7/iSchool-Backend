import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/database/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  const gradeP1 = await prisma.grade.upsert({
    where: { name: 'P1' },
    update: {},
    create: {
      name: 'P1',
      level: 1,
    },
  });

  const gradeP2 = await prisma.grade.upsert({
    where: { name: 'P2' },
    update: {},
    create: {
      name: 'P2',
      level: 2,
    },
  });

  const gradeP3 = await prisma.grade.upsert({
    where: { name: 'P3' },
    update: {},
    create: {
      name: 'P3',
      level: 3,
    },
  });

  const gradeP4 = await prisma.grade.upsert({
    where: { name: 'P4' },
    update: {},
    create: {
      name: 'P4',
      level: 4,
    },
  });

  const gradeP5 = await prisma.grade.upsert({
    where: { name: 'P5' },
    update: {},
    create: {
      name: 'P5',
      level: 5,
    },
  });

  const gradeP6 = await prisma.grade.upsert({
    where: { name: 'P6' },
    update: {},
    create: {
      name: 'P6',
      level: 6,
    },
  });

  const classroomP1 = await prisma.classroom.upsert({
    where: { name: 'P1/1' },
    update: {},
    create: {
      name: 'P1/1',
      gradeId: gradeP1.id,
    },
  });

  const classroomP2 = await prisma.classroom.upsert({
    where: { name: 'P2/1' },
    update: {},
    create: {
      name: 'P2/1',
      gradeId: gradeP2.id,
    },
  });

  const classroomP3 = await prisma.classroom.upsert({
    where: { name: 'P3/1' },
    update: {},
    create: {
      name: 'P3/1',
      gradeId: gradeP3.id,
    },
  });

  const classroomP4 = await prisma.classroom.upsert({
    where: { name: 'P4/1' },
    update: {},
    create: {
      name: 'P4/1',
      gradeId: gradeP4.id,
    },
  });

  const classroomP5 = await prisma.classroom.upsert({
    where: { name: 'P5/1' },
    update: {},
    create: {
      name: 'P5/1',
      gradeId: gradeP5.id,
    },
  });

  const classroomP6 = await prisma.classroom.upsert({
    where: { name: 'P6/1' },
    update: {},
    create: {
      name: 'P6/1',
      gradeId: gradeP6.id,
    },
  });
};

main().catch((error) => console.log(error));
