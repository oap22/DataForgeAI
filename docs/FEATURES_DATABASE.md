# ✨ Features: PostgreSQL Database for User Web Activity

> **Goal:** Create a PostgreSQL database hosted on Google Cloud SQL to securely store user web activity data including cookies, web history, time spent on sites, and demographic information.

---

## 📋 Overview

This document outlines the step-by-step plan for designing, implementing, and deploying a **PostgreSQL database** on **Google Cloud SQL** to power DataForge's user web activity tracking system.

### Why PostgreSQL on Google Cloud?

| Benefit | Description |
|---------|-------------|
| 🤖 **AI Access** | Cloud-hosted data enables AI model training and real-time insights |
| 📊 **Scalability** | Easily scale as user base grows |
| ⚡ **Performance** | Managed database with automatic optimization |
| 🔒 **Security** | Enterprise-grade encryption and access controls |
| 🌐 **Accessibility** | Access from Chrome Extension, Web Dashboard, and AI services |
| 💾 **Reliability** | Automatic backups and high availability |

---

## 🗂️ Data Categories

The database stores four primary categories of user data:

| Category | Description | Example Data |
|----------|-------------|--------------|
| 👤 **Demographics** | User profile and demographic info | Age, gender, country, income bracket, education |
| 🍪 **Cookies** | Browser cookies collected with consent | Cookie name, value, domain, expiration, type |
| 🌐 **Web History** | URLs visited by the user | URL, page title, visit timestamp, referrer |
| ⏱️ **Time Spent** | Duration of time spent on websites | Domain, session duration, active time, scroll depth |

---

## 🚀 Implementation Status

### ✅ Phase 1: Database Design & Schema (Complete)

The PostgreSQL schema has been implemented in `src/database/schema.sql`:

| Table | Purpose |
|-------|---------|
| `users` | User accounts with demographic information |
| `sessions` | Browsing sessions with device metadata |
| `cookies` | Cookie data with type classification |
| `web_history` | URL visits with referrer tracking |
| `time_spent` | Engagement metrics per page |
| `consent_log` | Audit trail for data sharing consent |
| `daily_summary` | Pre-computed analytics for dashboards |

**Key Features:**
- Native UUID generation with `uuid-ossp` extension
- `TIMESTAMPTZ` for timezone-aware timestamps
- `JSONB` for flexible data storage
- 15+ performance indexes
- 4 analytics views
- Auto-update triggers for `updated_at`

---

### Phase 2: Indexing & Optimization

Indexes have been created for all common query patterns:

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_country ON users(country);

-- Web history (most frequent queries)
CREATE INDEX idx_web_history_user_domain ON web_history(user_id, domain);
CREATE INDEX idx_web_history_user_visited ON web_history(user_id, visited_at DESC);

-- Time spent analysis
CREATE INDEX idx_time_spent_user_domain ON time_spent(user_id, domain);
```

---

### Phase 3: Security & Privacy

| Security Measure | Status |
|------------------|--------|
| SSL/TLS encryption in transit | ✅ Required for Cloud SQL |
| Row-Level Security (RLS) | 📋 Planned |
| Consent tracking in `consent_log` | ✅ Implemented |
| Data retention policies | ✅ SQL templates ready |
| User data export/deletion | 📋 Planned |

---

### Phase 4: Cloud Deployment

**Google Cloud SQL Setup:**

| Component | Configuration |
|-----------|---------------|
| Database Version | PostgreSQL 14 |
| Instance Tier | db-f1-micro (dev) / db-n1-standard-1 (prod) |
| Region | us-central1 |
| Storage | SSD, auto-resize |
| Backups | Daily automated |

See `src/database/README.md` for detailed setup instructions.

---

### Phase 5: API Integration Layer

TypeScript module created in `src/database/src/`:

| File | Purpose |
|------|---------|
| `db.ts` | Connection pooling, transactions, health checks |
| `queries.ts` | Pre-built analytics query functions |
| `init.ts` | Database initialization script |

**Example Usage:**
```typescript
import { createUser, getTopDomains } from '@dataforge/database';

const user = await createUser({
  email: 'user@example.com',
  age: 28,
  country: 'USA',
  consent_status: true,
});

const topDomains = await getTopDomains(user.user_id, 10);
```

---

### Phase 6: Analytics Views

Pre-built views for common analytics:

| View | Purpose |
|------|---------|
| `v_daily_domain_visits` | Daily visit counts by domain |
| `v_user_engagement` | Time spent and scroll depth by domain |
| `v_cookie_distribution` | Cookie counts by type and domain |
| `v_demographics_summary` | Anonymized demographic aggregations |

---

## ✅ Implementation Checklist

### Phase 1: Database Design
- [x] Finalize table schemas (PostgreSQL compatible)
- [x] Add demographic fields (age, gender, country, etc.)
- [x] Review relationships and constraints
- [x] Implement UUID generation

### Phase 2: Optimization
- [x] Create all necessary indexes
- [x] Configure connection pooling
- [ ] Test query performance with sample data

### Phase 3: Security
- [ ] Configure Row-Level Security
- [x] Set up consent tracking
- [ ] Implement data retention automation
- [ ] Build user data export/deletion

### Phase 4: Cloud Deployment
- [ ] Create Google Cloud SQL instance
- [x] Document connection setup
- [x] Include Docker for local development
- [ ] Set up Cloud SQL Proxy

### Phase 5: Integration
- [x] Create TypeScript database module
- [x] Implement connection pooling
- [ ] Connect Chrome Extension to API
- [ ] Build Web Dashboard

### Phase 6: Analytics
- [x] Create analytics views
- [x] Build summary table for dashboards
- [ ] Implement real-time data aggregation

---

## 📅 Estimated Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Design | 2-3 days | ✅ Complete |
| Phase 2: Optimization | 1-2 days | 🔄 In Progress |
| Phase 3: Security | 2-3 days | 📋 Planned |
| Phase 4: Deployment | 1-2 days | 📋 Planned |
| Phase 5: Integration | 3-5 days | 📋 Planned |
| Phase 6: Analytics | 2-3 days | 🔄 In Progress |

---

## 🔗 Related Documents

- [README.md](../README.md) - Project overview
- [Database README](../src/database/README.md) - Setup instructions
- *API Documentation* - Coming soon
- *Chrome Extension Docs* - Coming soon

---

*Last Updated: January 13, 2026*
