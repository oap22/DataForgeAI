/**
 * DataForgeAI Database Module
 * Main entry point - exports all database functionality
 */

export * from './db';
export * from './queries';

// Default export for convenience
import db from './db';
import queries from './queries';

export default {
    ...db,
    ...queries,
};
