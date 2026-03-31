import { BaseResponse } from './base-response.type';

export type SuccessResponse<T> = BaseResponse & {
  success: true;
  message?: string;
  data?: T;
  path: string;
  timestamp: string;
};
