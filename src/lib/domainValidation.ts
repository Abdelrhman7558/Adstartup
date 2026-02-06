export const PRODUCTION_DOMAIN = 'https://the-adagent.com';

export const ALLOWED_DOMAINS = [
  'https://the-adagent.com',
  'https://www.the-adagent.com',
  'https://ad-startup.com',
  'http://localhost:5173',
];

export function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const origin = `${urlObj.protocol}//${urlObj.host}`;
    return ALLOWED_DOMAINS.includes(origin);
  } catch {
    return false;
  }
}

export function validateRedirectUrl(url: string): string {
  if (!isAllowedDomain(url)) {
    console.error('[Security] Blocked redirect to non-whitelisted domain:', url);
    return `${PRODUCTION_DOMAIN}/signin`;
  }
  return url;
}

export function getAuthRedirectUrl(path: string): string {
  if (import.meta.env.DEV) {
    return `http://localhost:5173${path}`;
  }
  return `${PRODUCTION_DOMAIN}${path}`;
}

console.log('[DomainValidation] Initialized with production domain:', PRODUCTION_DOMAIN);
console.log('[DomainValidation] Allowed domains:', ALLOWED_DOMAINS);
