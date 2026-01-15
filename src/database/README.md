# DataForgeAI Database Module

This module provides the PostgreSQL database connection and query utilities for DataForgeAI.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+ (local or Google Cloud SQL)

### Installation

```bash
cd src/database
npm install
```

### Configuration

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=dataforge
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

### Initialize Database

```bash
npm run init-db
```

This creates all tables, indexes, and views from `schema.sql`.

---

## 🐳 Docker Setup (Local Development)

If you don't have PostgreSQL installed locally, use Docker:

### Option 1: Quick Start with Docker

```bash
# Pull and run PostgreSQL
docker run --name dataforge-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=devpassword123 \
  -e POSTGRES_DB=dataforge \
  -p 5432:5432 \
  -d postgres:14

# Verify it's running
docker ps
```

Your `.env` for Docker:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dataforge
DB_USER=postgres
DB_PASSWORD=devpassword123
DB_SSL=false
```

### Option 2: Docker Compose (Recommended)

Create a `docker-compose.yml` in this directory:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:14
    container_name: dataforge-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: devpassword123
      POSTGRES_DB: dataforge
    ports:
      - "5432:5432"
    volumes:
      - dataforge_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql

volumes:
  dataforge_data:
```

Then run:
```bash
docker-compose up -d
```

This automatically runs `schema.sql` on first startup!

### Docker Commands Reference

```bash
# Start container
docker start dataforge-postgres

# Stop container
docker stop dataforge-postgres

# View logs
docker logs dataforge-postgres

# Connect to psql
docker exec -it dataforge-postgres psql -U postgres -d dataforge

# Remove container (deletes data!)
docker rm -f dataforge-postgres
```

---

## 🌐 Google Cloud SQL Setup

### 1. Create Cloud SQL Instance

```bash
# Using gcloud CLI
gcloud sql instances create dataforge-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD

# Create database
gcloud sql databases create dataforge --instance=dataforge-db
```

### 2. Configure Connection

**Option A: Cloud SQL Proxy (Recommended for development)**

```bash
# Download Cloud SQL Proxy
# Windows: download from https://cloud.google.com/sql/docs/postgres/connect-auth-proxy

# Run proxy
cloud-sql-proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME
```

Your `.env`:
```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_NAME=dataforge
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_SSL=false
```

**Option B: Direct Connection (Requires public IP & SSL)**

```
DB_HOST=YOUR_CLOUD_SQL_IP
DB_PORT=5432
DB_NAME=dataforge
DB_USER=postgres
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_SSL=true
```

---

## 📚 Usage

### Basic Queries

```typescript
import db, { createUser, getTopDomains } from './src';

// Create a user
const user = await createUser({
  email: 'user@example.com',
  age: 28,
  gender: 'male',
  country: 'USA',
  consent_status: true,
});

// Get top domains
const topDomains = await getTopDomains(user.user_id, 10);
console.log(topDomains);

// Health check
const healthy = await db.healthCheck();
```

### Transactions

```typescript
import { transaction } from './src/db';

await transaction(async (client) => {
  await client.query('INSERT INTO users ...');
  await client.query('INSERT INTO consent_log ...');
  // Both succeed or both fail
});
```

---

## 📁 File Structure

```
src/database/
├── schema.sql          # PostgreSQL schema (tables, indexes, views)
├── package.json        # npm dependencies
├── tsconfig.json       # TypeScript config
├── .env.example        # Environment template
├── .gitignore          # Ignore node_modules, .env
├── README.md           # This file
└── src/
    ├── index.ts        # Main exports
    ├── db.ts           # Connection pool & utilities
    ├── init.ts         # Schema initialization script
    └── queries.ts      # Analytics query functions
```

---

## 🧪 Testing

```bash
# Run TypeScript checks
npm run build

# Initialize database
npm run init-db
```

---

## 🔒 Security Notes

1. **Never commit `.env`** - It contains database credentials
2. **Use SSL in production** - Required for Google Cloud SQL
3. **Rotate passwords regularly** - Especially for production
4. **Use IAM authentication** - For Google Cloud SQL in production
