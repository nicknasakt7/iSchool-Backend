import { HttpException, HttpStatus } from '@nestjs/common';

export class AppException extends HttpException {
  constructor(message: string, code: string, status: HttpStatus) {
    super(
      {
        success: false,
        message,
        code,
      },
      status,
    );
  }
}
