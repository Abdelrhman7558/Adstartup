/**
 * Centralized webhook utilities for user-level data isolation
 * CRITICAL: All webhook communications MUST include user_id
 */

export class WebhookValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookValidationError';
  }
}

/**
 * Validates that user_id exists and is a non-empty string
 * Throws WebhookValidationError if validation fails
 */
export function validateUserId(userId?: string): string {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    const error = new WebhookValidationError(
      'CRITICAL: user_id is required for all webhook communications. User must be authenticated.'
    );
    console.error('[WebhookValidation]', error.message);
    throw error;
  }
  return userId.trim();
}

/**
 * Makes a GET request to a webhook endpoint with user_id
 * Enforces user_id in query parameters for data isolation
 */
export async function webhookGet<T = any>(
  url: string,
  userId: string,
  options?: RequestInit
): Promise<T> {
  const validatedUserId = validateUserId(userId);

  // Append user_id as query parameter for GET requests
  const urlWithUserId = new URL(url);
  urlWithUserId.searchParams.set('user_id', validatedUserId);

  console.log(`[WebhookGET] Requesting with user_id:`, validatedUserId.substring(0, 8) + '...');

  const response = await fetch(urlWithUserId.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Webhook GET failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Makes a POST request to a webhook endpoint with user_id in body
 * Enforces user_id at root level of JSON payload
 */
export async function webhookPost<T = any>(
  url: string,
  userId: string,
  payload: Record<string, any>,
  options?: RequestInit
): Promise<T> {
  const validatedUserId = validateUserId(userId);

  // Ensure user_id is at root level of payload
  const payloadWithUserId = {
    user_id: validatedUserId,
    ...payload,
  };

  console.log(`[WebhookPOST] Sending with user_id:`, validatedUserId.substring(0, 8) + '...');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: JSON.stringify(payloadWithUserId),
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Webhook POST failed: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Wrapper for webhook calls with comprehensive error handling
 * Returns result or null on error
 */
export async function safeWebhookCall<T = any>(
  callFn: () => Promise<T>,
  fallbackValue: T,
  contextLabel: string
): Promise<T> {
  try {
    return await callFn();
  } catch (error) {
    if (error instanceof WebhookValidationError) {
      console.error(`[${contextLabel}] Validation Error:`, error.message);
    } else {
      console.error(`[${contextLabel}] Webhook Error:`, error);
    }
    return fallbackValue;
  }
}

/**
 * Logs webhook communication for debugging and audit trail
 */
export function logWebhookCall(
  method: 'GET' | 'POST',
  endpoint: string,
  userId: string,
  success: boolean,
  details?: Record<string, any>
): void {
  const timestamp = new Date().toISOString();
  const userIdShort = userId?.substring(0, 8) + '...' || 'MISSING';

  console.log(`[WebhookLog] ${timestamp} | ${method} ${endpoint} | User: ${userIdShort} | Success: ${success}`, details || '');
}
