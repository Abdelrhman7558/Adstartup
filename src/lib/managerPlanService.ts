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
    if (!email) {
        console.log('[ManagerPlan] Check failed: No email provided');
        return false;
    }
    const normalizedEmail = email.trim().toLowerCase();
    const isManager = MANAGER_PLAN_EMAILS.includes(normalizedEmail as typeof MANAGER_PLAN_EMAILS[number]);
    console.log(`[ManagerPlan] Checking email: "${email}" (normalized: "${normalizedEmail}") -> Is Manager: ${isManager}`);
    return isManager;
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
