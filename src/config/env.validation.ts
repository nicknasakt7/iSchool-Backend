import { Logger } from '@nestjs/common';
import z from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return value;
}, z.boolean());

const plainEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const displayNameEmailPattern = /^.+\s<[^<>\s@]+@[^\s@]+\.[^\s@]+>$/;

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535),
  DATABASE_URL: z.url(),
  SALT_ROUNDS: z.coerce.number().int().min(10),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.coerce.number().int().positive(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  INVITE_EXPIRES_IN: z.coerce.number().int().positive(),
  FRONTEND_URL: z.string().url(),
  INVITE_REGISTER_PATH: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  MAIL_HOST: z.string().min(1).optional(),
  MAIL_PORT: z.coerce.number().int().positive().default(587),
  MAIL_USER: z.string().min(1).optional(),
  MAIL_PASSWORD: z.string().min(1).optional(),
  MAIL_FROM: z
    .string()
    .trim()
    .refine(
      (value) =>
        plainEmailPattern.test(value) || displayNameEmailPattern.test(value),
      {
        message:
          'MAIL_FROM must be either "email@example.com" or "Display Name <email@example.com>"',
      },
    )
    .default('no-reply@fakebuck.local'),
  MAIL_SECURE: booleanFromEnv.default(false),
  FRONTEND_RESET_PASSWORD_URL: z
    .string()
    .url()
    .default('http://localhost:3000/reset-password'),
  RESET_PASSWORD_TOKEN_EXPIRES_IN: z.coerce
    .number()
    .int()
    .positive()
    .default(900),
});

export type EnvConfigType = z.infer<typeof envSchema>;

export const validate = (config: Record<string, any>) => {
  const { success, data, error } = envSchema.safeParse(config);
  if (!success) {
    const logger = new Logger('EnvValidation');
    logger.error(`Env validation faild: \n${z.prettifyError(error)}`);
    process.exit(1);
  }
  return data;
};
