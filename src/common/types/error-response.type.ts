import { BaseResponse } from './base-response.type';

export type ErrorResponse = BaseResponse & {
  success: false;
  message: string;
  code?: string;
};
