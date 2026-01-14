-- ============================================================================
-- DataForgeAI PostgreSQL Schema
-- Google Cloud SQL Compatible
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table with demographic information
CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    
    -- Demographics
    age             INTEGER,
    gender          VARCHAR(50),
    race_ethnicity  VARCHAR(100),
    country         VARCHAR(100),
    region          VARCHAR(100),  -- State/Province
    income_bracket  VARCHAR(50),   -- e.g., '50k-75k', '75k-100k'
    education_level VARCHAR(100),  -- e.g., 'Bachelor's', 'Master's'
    occupation      VARCHAR(255),
    
    -- Consent & Settings
    consent_status  BOOLEAN DEFAULT FALSE,
    data_sharing    JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table for browsing sessions
CREATE TABLE sessions (
    session_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    started_at      TIMESTAMPTZ DEFAULT NOW(),
    ended_at        TIMESTAMPTZ,
    device_type     VARCHAR(50),   -- 'desktop', 'mobile', 'tablet'
    browser         VARCHAR(100),
    browser_version VARCHAR(50),
    os              VARCHAR(100),
    os_version      VARCHAR(50),
    screen_width    INTEGER,
    screen_height   INTEGER
);

-- Cookies table
CREATE TABLE cookies (
    cookie_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_id      UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
    domain          VARCHAR(255) NOT NULL,
    cookie_name     VARCHAR(255) NOT NULL,
    cookie_value    TEXT,
    cookie_type     VARCHAR(50),   -- 'first_party', 'third_party', 'tracking', 'functional'
    expiration      TIMESTAMPTZ,
    is_secure       BOOLEAN DEFAULT FALSE,
    is_http_only    BOOLEAN DEFAULT FALSE,
    same_site       VARCHAR(20),   -- 'strict', 'lax', 'none'
    collected_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Web history table
CREATE TABLE web_history (
    history_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_id      UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
    url             TEXT NOT NULL,
    domain          VARCHAR(255) NOT NULL,
    path            TEXT,
    page_title      TEXT,
    referrer_url    TEXT,
    referrer_domain VARCHAR(255),
    visited_at      TIMESTAMPTZ DEFAULT NOW(),
    visit_type      VARCHAR(50)    -- 'link', 'typed', 'reload', 'back_forward', 'bookmark'
);

-- Time spent tracking
CREATE TABLE time_spent (
    time_id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(user_id) ON DELETE CASCADE,
    session_id          UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
    history_id          UUID REFERENCES web_history(history_id) ON DELETE SET NULL,
    domain              VARCHAR(255) NOT NULL,
    url                 TEXT NOT NULL,
    duration_seconds    INTEGER NOT NULL,
    active_seconds      INTEGER,       -- Time user was actively engaged
    idle_seconds        INTEGER,       -- Time page was open but user idle
    scroll_depth        DECIMAL(5,2),  -- Percentage of page scrolled (0.00-100.00)
    clicks              INTEGER DEFAULT 0,
    started_at          TIMESTAMPTZ NOT NULL,
    ended_at            TIMESTAMPTZ
);

-- Consent audit log
CREATE TABLE consent_log (
    log_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    consent_type    VARCHAR(100) NOT NULL,  -- 'cookies', 'web_history', 'time_tracking', 'demographics'
    consent_given   BOOLEAN NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-computed daily summaries for dashboard performance
CREATE TABLE daily_summary (
    summary_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
    summary_date    DATE NOT NULL,
    total_visits    INTEGER DEFAULT 0,
    total_time_seconds INTEGER DEFAULT 0,
    unique_domains  INTEGER DEFAULT 0,
    top_domain      VARCHAR(255),
    avg_scroll_depth DECIMAL(5,2),
    total_clicks    INTEGER DEFAULT 0,
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, summary_date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_country ON users(country);
CREATE INDEX idx_users_age ON users(age);
CREATE INDEX idx_users_gender ON users(gender);

-- Session queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);
CREATE INDEX idx_sessions_device_type ON sessions(device_type);

-- Cookie queries
CREATE INDEX idx_cookies_user_id ON cookies(user_id);
CREATE INDEX idx_cookies_domain ON cookies(domain);
CREATE INDEX idx_cookies_collected_at ON cookies(collected_at);
CREATE INDEX idx_cookies_type ON cookies(cookie_type);

-- Web history queries (most frequent)
CREATE INDEX idx_web_history_user_id ON web_history(user_id);
CREATE INDEX idx_web_history_domain ON web_history(domain);
CREATE INDEX idx_web_history_visited_at ON web_history(visited_at);
CREATE INDEX idx_web_history_user_domain ON web_history(user_id, domain);
CREATE INDEX idx_web_history_user_visited ON web_history(user_id, visited_at DESC);

-- Time spent queries
CREATE INDEX idx_time_spent_user_id ON time_spent(user_id);
CREATE INDEX idx_time_spent_domain ON time_spent(domain);
CREATE INDEX idx_time_spent_started_at ON time_spent(started_at);
CREATE INDEX idx_time_spent_user_domain ON time_spent(user_id, domain);

-- Daily summary queries
CREATE INDEX idx_daily_summary_user_date ON daily_summary(user_id, summary_date DESC);

-- ============================================================================
-- ANALYTICS VIEWS
-- ============================================================================

-- Daily domain visits aggregation
CREATE VIEW v_daily_domain_visits AS
SELECT 
    user_id,
    domain,
    DATE(visited_at) as visit_date,
    COUNT(*) as visit_count,
    COUNT(DISTINCT session_id) as session_count
FROM web_history
GROUP BY user_id, domain, DATE(visited_at);

-- User engagement summary by domain
CREATE VIEW v_user_engagement AS
SELECT 
    user_id,
    domain,
    SUM(duration_seconds) as total_time_seconds,
    SUM(active_seconds) as total_active_seconds,
    AVG(scroll_depth) as avg_scroll_depth,
    SUM(clicks) as total_clicks,
    COUNT(*) as visit_count
FROM time_spent
GROUP BY user_id, domain;

-- Cookie distribution by type
CREATE VIEW v_cookie_distribution AS
SELECT 
    user_id,
    domain,
    cookie_type,
    COUNT(*) as cookie_count
FROM cookies
GROUP BY user_id, domain, cookie_type;

-- Demographics summary (for AI insights, anonymized)
CREATE VIEW v_demographics_summary AS
SELECT 
    country,
    region,
    age,
    gender,
    income_bracket,
    education_level,
    COUNT(*) as user_count
FROM users
WHERE consent_status = TRUE
GROUP BY country, region, age, gender, income_bracket, education_level;

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_summary_updated_at
    BEFORE UPDATE ON daily_summary
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DATA RETENTION POLICY (run periodically via cron/scheduler)
-- ============================================================================

-- Example: Delete data older than 90 days (configurable)
-- DELETE FROM web_history WHERE visited_at < NOW() - INTERVAL '90 days';
-- DELETE FROM cookies WHERE collected_at < NOW() - INTERVAL '90 days';
-- DELETE FROM time_spent WHERE started_at < NOW() - INTERVAL '90 days';
