/**
 * DataForgeAI Analytics Queries
 * Pre-built query functions for common analytics operations
 */

import { query, generateUUID } from './db';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface User {
    user_id: string;
    email: string;
    age?: number;
    gender?: string;
    race_ethnicity?: string;
    country?: string;
    region?: string;
    income_bracket?: string;
    education_level?: string;
    occupation?: string;
    consent_status: boolean;
    data_sharing: Record<string, unknown>;
    created_at: Date;
    updated_at: Date;
}

export interface WebHistoryEntry {
    history_id: string;
    user_id: string;
    session_id?: string;
    url: string;
    domain: string;
    page_title?: string;
    referrer_url?: string;
    visited_at: Date;
    visit_type?: string;
}

export interface TimeSpentEntry {
    time_id: string;
    user_id: string;
    domain: string;
    url: string;
    duration_seconds: number;
    active_seconds?: number;
    scroll_depth?: number;
    started_at: Date;
}

export interface DomainVisit {
    domain: string;
    visit_date: string;
    visit_count: number;
    session_count: number;
}

export interface EngagementSummary {
    domain: string;
    total_time_seconds: number;
    avg_scroll_depth: number;
    total_clicks: number;
    visit_count: number;
}

// ============================================================================
// USER QUERIES
// ============================================================================

/**
 * Create a new user
 */
export async function createUser(userData: Partial<User>): Promise<User> {
    const result = await query<User>(
        `INSERT INTO users (
      user_id, email, age, gender, race_ethnicity, country, region,
      income_bracket, education_level, occupation, consent_status, data_sharing
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
        [
            generateUUID(),
            userData.email,
            userData.age,
            userData.gender,
            userData.race_ethnicity,
            userData.country,
            userData.region,
            userData.income_bracket,
            userData.education_level,
            userData.occupation,
            userData.consent_status ?? false,
            JSON.stringify(userData.data_sharing ?? {}),
        ]
    );
    return result.rows[0];
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
    const result = await query<User>(
        'SELECT * FROM users WHERE user_id = $1',
        [userId]
    );
    return result.rows[0] ?? null;
}

/**
 * Update user consent status
 */
export async function updateConsent(
    userId: string,
    consentStatus: boolean
): Promise<void> {
    await query(
        'UPDATE users SET consent_status = $1, updated_at = NOW() WHERE user_id = $2',
        [consentStatus, userId]
    );

    // Log consent change
    await query(
        `INSERT INTO consent_log (log_id, user_id, consent_type, consent_given)
     VALUES ($1, $2, 'general', $3)`,
        [generateUUID(), userId, consentStatus]
    );
}

// ============================================================================
// WEB HISTORY QUERIES
// ============================================================================

/**
 * Log a web page visit
 */
export async function logPageVisit(entry: Partial<WebHistoryEntry>): Promise<string> {
    const historyId = generateUUID();
    await query(
        `INSERT INTO web_history (
      history_id, user_id, session_id, url, domain, path, page_title, 
      referrer_url, referrer_domain, visit_type
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
            historyId,
            entry.user_id,
            entry.session_id,
            entry.url,
            entry.domain,
            new URL(entry.url || '').pathname,
            entry.page_title,
            entry.referrer_url,
            entry.referrer_url ? new URL(entry.referrer_url).hostname : null,
            entry.visit_type,
        ]
    );
    return historyId;
}

/**
 * Get user's web history with pagination
 */
export async function getUserHistory(
    userId: string,
    limit = 50,
    offset = 0
): Promise<WebHistoryEntry[]> {
    const result = await query<WebHistoryEntry>(
        `SELECT * FROM web_history 
     WHERE user_id = $1 
     ORDER BY visited_at DESC 
     LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
    );
    return result.rows;
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Get daily domain visits for a user
 */
export async function getDailyDomainVisits(
    userId: string,
    startDate: Date,
    endDate: Date
): Promise<DomainVisit[]> {
    const result = await query<DomainVisit>(
        `SELECT * FROM v_daily_domain_visits 
     WHERE user_id = $1 
       AND visit_date BETWEEN $2 AND $3
     ORDER BY visit_date DESC, visit_count DESC`,
        [userId, startDate, endDate]
    );
    return result.rows;
}

/**
 * Get user engagement summary by domain
 */
export async function getUserEngagement(userId: string): Promise<EngagementSummary[]> {
    const result = await query<EngagementSummary>(
        `SELECT * FROM v_user_engagement 
     WHERE user_id = $1 
     ORDER BY total_time_seconds DESC`,
        [userId]
    );
    return result.rows;
}

/**
 * Get top visited domains for a user
 */
export async function getTopDomains(
    userId: string,
    limit = 10
): Promise<{ domain: string; visit_count: number }[]> {
    const result = await query<{ domain: string; visit_count: number }>(
        `SELECT domain, COUNT(*) as visit_count 
     FROM web_history 
     WHERE user_id = $1 
     GROUP BY domain 
     ORDER BY visit_count DESC 
     LIMIT $2`,
        [userId, limit]
    );
    return result.rows;
}

/**
 * Get cookie distribution by type for a user
 */
export async function getCookiesByType(
    userId: string
): Promise<{ cookie_type: string; count: number }[]> {
    const result = await query<{ cookie_type: string; count: number }>(
        `SELECT cookie_type, COUNT(*) as count 
     FROM cookies 
     WHERE user_id = $1 
     GROUP BY cookie_type 
     ORDER BY count DESC`,
        [userId]
    );
    return result.rows;
}

/**
 * Get aggregated demographics for AI insights (anonymized)
 */
export async function getDemographicsSummary(): Promise<{
    country: string;
    age_group: string;
    gender: string;
    user_count: number;
}[]> {
    const result = await query<{
        country: string;
        age_group: string;
        gender: string;
        user_count: number;
    }>(
        `SELECT 
       country,
       CASE 
         WHEN age < 18 THEN 'under_18'
         WHEN age BETWEEN 18 AND 24 THEN '18-24'
         WHEN age BETWEEN 25 AND 34 THEN '25-34'
         WHEN age BETWEEN 35 AND 44 THEN '35-44'
         WHEN age BETWEEN 45 AND 54 THEN '45-54'
         WHEN age BETWEEN 55 AND 64 THEN '55-64'
         ELSE '65+'
       END as age_group,
       gender,
       COUNT(*) as user_count
     FROM users
     WHERE consent_status = TRUE
     GROUP BY country, age_group, gender
     ORDER BY user_count DESC`,
        []
    );
    return result.rows;
}

/**
 * Refresh daily summary for a user
 */
export async function refreshDailySummary(
    userId: string,
    date: Date
): Promise<void> {
    const summaryDate = date.toISOString().split('T')[0];

    await query(
        `INSERT INTO daily_summary (
       summary_id, user_id, summary_date, total_visits, total_time_seconds,
       unique_domains, top_domain, avg_scroll_depth, total_clicks
     )
     SELECT 
       $1, $2, $3,
       COUNT(DISTINCT h.history_id),
       COALESCE(SUM(t.duration_seconds), 0),
       COUNT(DISTINCT h.domain),
       (SELECT domain FROM web_history WHERE user_id = $2 AND DATE(visited_at) = $3 GROUP BY domain ORDER BY COUNT(*) DESC LIMIT 1),
       AVG(t.scroll_depth),
       COALESCE(SUM(t.clicks), 0)
     FROM web_history h
     LEFT JOIN time_spent t ON h.history_id = t.history_id
     WHERE h.user_id = $2 AND DATE(h.visited_at) = $3
     ON CONFLICT (user_id, summary_date) 
     DO UPDATE SET
       total_visits = EXCLUDED.total_visits,
       total_time_seconds = EXCLUDED.total_time_seconds,
       unique_domains = EXCLUDED.unique_domains,
       top_domain = EXCLUDED.top_domain,
       avg_scroll_depth = EXCLUDED.avg_scroll_depth,
       total_clicks = EXCLUDED.total_clicks,
       updated_at = NOW()`,
        [generateUUID(), userId, summaryDate]
    );
}

export default {
    // User operations
    createUser,
    getUserById,
    updateConsent,

    // History operations
    logPageVisit,
    getUserHistory,

    // Analytics
    getDailyDomainVisits,
    getUserEngagement,
    getTopDomains,
    getCookiesByType,
    getDemographicsSummary,
    refreshDailySummary,
};
