# NIATALA Phase 1 - Authentication & Multi-Tenant Foundation

## Setup Instructions

### Prerequisites
- Node.js 20+
- npm 10+
- Docker + Docker Compose (for PostgreSQL)
- PostgreSQL 16 (running in Docker)

### Step 1: PostgreSQL Setup

```bash
cd .. # Go to project root
docker-compose up -d postgres

# Wait for PostgreSQL to be healthy
docker-compose ps

# Should see: postgres   ... Up ... (healthy)
```

Verify connection:
```bash
docker exec niatala-postgres psql -U niatala_dev -d niatala -c "SELECT version();"
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `@prisma/client` - ORM
- `prisma` - CLI
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT tokens
- `cookie-parser` - Cookie handling
- TypeScript types for all of the above

### Step 3: Initialize Database Schema

```bash
# Create and run initial migration
npx prisma migrate dev --name init

# This will:
# 1. Create all tables (tenants, users, sessions, audit_logs)
# 2. Run migrations
# 3. Generate Prisma Client
```

**Important**: If you already have tables, you can sync with:
```bash
npx prisma db push
```

### Step 4: Migrate Existing Users (Optional)

If you have existing users in localStorage, run:

```bash
npx tsx scripts/migrateUsers.ts
```

This script will:
1. Read legacy users from `scripts/users-backup.json`
2. Create an INITIAL_TENANT
3. Hash passwords with bcrypt
4. Migrate users to PostgreSQL
5. Verify data integrity

### Step 5: Start Backend Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /auth/login` - Login with username/password → returns JWT in httpOnly cookie
- `POST /auth/logout` - Logout (revoke session)
- `GET /auth/me` - Get current user info (requires auth)

### Testing Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  -c cookies.txt

# Using the saved cookies:
curl http://localhost:3001/auth/me -b cookies.txt
```

## Security Notes

### Passwords
- All passwords are hashed with **bcrypt** (10 rounds of salt)
- Passwords are **never** stored in plaintext
- Passwords are **never** sent in JWT tokens
- Old passwords cannot be recovered

### Sessions
- JWT tokens are stored in **httpOnly cookies** (not accessible to JavaScript)
- Tokens expire after **24 hours**
- Sessions are tracked in PostgreSQL and can be revoked
- Revoked sessions cannot be used even if token is valid

### Multi-Tenant Isolation
- SUPER_ADMIN: Can access any tenant (read-only by default)
- ADMIN/CAISSIER: Can only access their own tenant
- Tenant ID is determined from JWT token, never from request data

## Environment Variables

Create `.env` file (copy from `.env.example`):

```env
# Database
DB_HOST=localhost
DB_PORT=5433
DB_NAME=niatala
DB_USER=niatala_dev
DB_PASSWORD=dev_password_secure_change

# JWT
JWT_SECRET=super_secret_change_in_production
JWT_EXPIRY=24h

# Server
NODE_ENV=development
PORT=3001
```

**IMPORTANT**: Never commit `.env` file!

## Testing

### Unit Tests (No Database Required)
```bash
npm test
```

Tests for:
- Bcrypt password hashing
- JWT token generation/verification
- Token hashing
- Salt randomization
- Password security

### Integration Tests (Requires Database)
```bash
npm run test:integration
```

Tests for:
- User login/logout
- Session creation/revocation
- Tenant isolation
- Role-based access control

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
npm install @prisma/client
npx prisma generate
```

### "PostgreSQL connection refused"
- Ensure Docker container is running: `docker-compose ps`
- Check PORT 5433 is not in use: `netstat -an | grep 5433`
- Verify DATABASE_URL in `.env`

### "User already exists"
This is normal when re-running migrations. Prisma will skip existing data.

### "Token invalid or expired"
- JWT tokens expire after 24 hours
- Sessions can be revoked (logout)
- Generate a new token by logging in again

## Database Schema

### Tenants Table
- `id` (UUID primary key)
- `name` (tenant name)
- `slug` (unique identifier)
- `status` (ACTIVE, SUSPENDED, DELETED)
- Business info (name, phone, address)
- Subscription info (status, expiry)

### Users Table
- `id` (UUID primary key)
- `tenantId` (FK to tenants, NULL = SUPER_ADMIN)
- `username` (unique per tenant)
- `passwordHash` (bcrypt)
- `role` (SUPER_ADMIN, ADMIN, CAISSIER)
- `status` (ACTIVE, DISABLED, SUSPENDED)
- Audit fields (createdBy, createdAt, lastLogin, lastIp)

### Sessions Table
- `id` (UUID primary key)
- `userId` (FK to users)
- `tokenHash` (SHA-256 hash of JWT)
- `expiresAt` (expiration timestamp)
- Metadata (ipAddress, userAgent)
- Revocation (revokedAt, revokeReason)

### AuditLogs Table
- `id` (UUID primary key)
- `userId` (who did it, can be NULL for system)
- `tenantId` (which tenant, NULL = global action)
- `action` (LOGIN, CREATE_USER, etc.)
- `resourceType` (USER, SALE, PAYMENT, etc.)
- `status` (SUCCESS, FAILED, DENIED)
- `details` (JSON context)
- Metadata (ip, userAgent)

## Next Steps (Phase 2)

Phase 2 will add:
- Tenant-specific tables (products, sales, clients, etc.)
- Tenant isolation middleware
- Role-based permission system
- Back-office SUPER_ADMIN interface

---

**Do not commit**:
- `.env` (secrets)
- `node_modules/` (dependencies)
- `dist/` (compiled code)

**Always commit**:
- `.env.example` (template)
- `prisma/schema.prisma` (schema)
- `prisma/migrations/` (migration history)
- `package.json` + `package-lock.json` (dependencies)
