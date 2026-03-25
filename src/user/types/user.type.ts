import { User } from 'src/database/generated/prisma/browser';

export type UserWithoutPassword = Omit<User, 'password'>;
