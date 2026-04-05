# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Development (watch mode)
pnpm run start:dev

# Build
pnpm run build

# Lint (auto-fix)
pnpm run lint

# Run all unit tests
pnpm run test

# Run a single test file
pnpm run test -- --testPathPattern="src/auth/auth.service.spec.ts"

# Run tests in watch mode
pnpm run test:watch

# Run e2e tests
pnpm run test:e2e

# Database migrations
npx prisma migrate dev --name <migration_name>

# Run database seed
npx prisma migrate seed
# or: tsx prisma/seed.ts

# Regenerate Prisma client (after schema changes)
npx prisma generate
```

## Required Environment Variables

Validated at startup via Zod in [src/config/env.validation.ts](src/config/env.validation.ts). The app will exit immediately if any are missing or invalid:

| Variable | Description |
|---|---|
| `PORT` | Server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `SALT_ROUNDS` | bcrypt salt rounds (min 10) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | JWT expiry in seconds |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `INVITE_EXPIRES_IN` | Parent invite token expiry in seconds |
| `FRONTEND_URL` | Frontend URL (used to build invite links) |
| `INVITE_REGISTER_PATH` | Path appended to `FRONTEND_URL` for invite links |

## Architecture

This is a **NestJS** REST API for a school management system backed by **PostgreSQL** via **Prisma ORM**.

### Key globals (registered in AppModule)

- **`TransformInterceptor`** — wraps all successful responses in `{ success: true, message, data, path, timestamp }` shape
- **`HttpExceptionFilter`** — catches all exceptions and returns `{ success: false, message, code, path, timestamp }`
- **`ClassSerializerInterceptor`** — respects `@Exclude()` / `@Expose()` from `class-transformer`
- **`GlobalValidationPipe`** — validates all incoming DTOs (defined in [src/common/pipes/global-validation.pipe.ts](src/common/pipes/global-validation.pipe.ts))

> **Note:** `AuthGuard` and `RoleGuard` are currently commented out in `AppModule` — routes are not globally protected. Guards must be applied per-controller or per-route.

### Auth & authorization

- `AuthGuard` (`src/auth/guards/auth.guard.ts`) — validates `Bearer` JWT in `Authorization` header and attaches the decoded payload to `request.user`
- `RoleGuard` (`src/auth/guards/role.guard.ts`) — checks `request.user.role` against `@Roles(...)` decorator
- `@Public()` decorator — skips `AuthGuard` for a route
- `@Roles(Role.ADMIN, ...)` decorator — restricts access by role
- Roles: `SUPER_ADMIN`, `ADMIN`, `TEACHER`, `PARENTS`

### Shared services

- **`PrismaService`** ([src/database/prisma.service.ts](src/database/prisma.service.ts)) — global singleton, inject to access the DB
- **`TypedConfigService`** ([src/config/typed-config.service.ts](src/config/typed-config.service.ts)) — type-safe wrapper around `ConfigService`, use instead of raw `process.env`
- **`BcryptService`** — password hashing
- **`AuthTokenService`** — JWT sign/verify
- **`CloudinaryService`** — image upload/delete

### Domain modules

| Module | Description |
|---|---|
| `user` | Base user accounts (linked to `parent` or `teacher` profiles) |
| `auth` | Login/register, returns JWT |
| `student` | Student profiles with profile image support (Cloudinary) |
| `teacher` | Teacher profiles, homeroom class assignment |
| `parent` | Parent profiles linked to students |
| `invite` | Email invite flow for parents (token-based, expiry enforced) |
| `classroom` | Classrooms belonging to a `Grade` |
| `subject` | Subjects |
| `subject-assignment` | Assigns a teacher to teach a subject in a classroom |
| `score` | `Score` (per student/subject/term/year) + `ScoreItem` entries driven by `AssessmentConfig` |
| `attendance` | Daily attendance records (PRESENT/ABSENT) |
| `teacher-comment` | Teacher comments on students per subject/term/year (1 per unique key) |
| `notice` | Announcements/notices |
| `calendar` | Calendar images |

### Prisma & database conventions

- Generated client is in `src/database/generated/prisma/` — import enums and types from there, not from `@prisma/client`
- Soft deletes use `deletedAt DateTime?` — query logic must filter `deletedAt: null` manually
- `term` + `year` are used throughout (scores, attendance, enrollment history, comments) to scope records academically
- `SubjectAssignment` is the join table linking Teacher → Subject → Classroom (unique triplet)
- `AssessmentConfig` drives the score structure; `Score` holds aggregates, `ScoreItem` holds per-config values

## DTO Naming Convention

All DTO variables must follow this format:

```
<dtoNameCamelCase>Dto
```

Examples:
- `UpsertConfigDto` → `upsertConfigDto`
- `ApplyConfigDto` → `applyConfigDto`
- `UpdateScoreItemDto` → `updateScoreItemDto`

Avoid generic names like `dto`, `data`, or `body`. This applies to controller parameters and service method parameters.
