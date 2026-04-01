import { Prisma } from 'src/database/generated/prisma/client';

export type UserWithTeacher = Prisma.UserGetPayload<{
  include: { teacher: true };
}>;
