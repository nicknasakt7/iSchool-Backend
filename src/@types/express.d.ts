import 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';

declare module 'express' {
  interface Request {
    user?: JwtPayload; // เพิ่มฟิลด์ `user` ใน `Request` ของ express
  }
}
