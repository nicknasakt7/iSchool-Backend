import { Role } from 'src/database/generated/prisma/enums';

export type JwtPayload = {
  sub: string; // user identifier (เช่น user ID)
  email: string; // email ของผู้ใช้
  iat?: number; // JWT issue time (เวลาที่สร้าง JWT)
  exp?: number; // JWT expiration time (เวลาหมดอายุของ JWT)
  role: Role;
};
