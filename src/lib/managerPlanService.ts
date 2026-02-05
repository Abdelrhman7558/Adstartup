/**
 * Manager Plan Service
 * 
 * This service handles access control for Manager plan exclusive features.
 * Manager plan users have special privileges like multiple Meta accounts.
 */

// Whitelisted emails for Manager plan
const MANAGER_PLAN_EMAILS = [
    'jihadalcc@gmail.com',
    '7bd02025@gmail.com',
] as const;

/**
 * Check if a user has Manager plan based on their email
 */
export function isManagerPlanUser(email: string | undefined | null): boolean {
    if (!email) return false;
    return MANAGER_PLAN_EMAILS.includes(email.trim().toLowerCase() as typeof MANAGER_PLAN_EMAILS[number]);
}

/**
 * Alias for isManagerPlanUser - checks if user has Manager plan features
 */
export function hasManagerPlanFeatures(email: string | undefined | null): boolean {
    return isManagerPlanUser(email);
}

/**
 * Get the plan name for display purposes
 */
export function getManagerPlanName(): string {
    return 'Manager';
}
