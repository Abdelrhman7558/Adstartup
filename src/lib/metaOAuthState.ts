export function generateMetaOAuthState(userId: string): string {
  if (!userId) {
    throw new Error('userId is required for OAuth state generation');
  }

  const timestamp = Date.now().toString();
  const stateData = `${userId}:${timestamp}`;

  const encoded = btoa(stateData);

  console.log('[OAuth State] Generated state for user:', userId.slice(0, 8) + '...', 'at', new Date().toISOString());

  return encoded;
}

export function decodeMetaOAuthState(state: string): { userId: string; timestamp: string } | null {
  try {
    if (!state) {
      console.error('[OAuth State] Empty state provided for decoding');
      return null;
    }

    const decoded = atob(state);
    const [userId, timestamp] = decoded.split(':');

    if (!userId || !timestamp) {
      console.error('[OAuth State] Invalid state format after decoding');
      return null;
    }

    console.log('[OAuth State] Decoded state for user:', userId.slice(0, 8) + '...', 'timestamp:', timestamp);

    return { userId, timestamp };
  } catch (error) {
    console.error('[OAuth State] Failed to decode OAuth state:', error);
    return null;
  }
}

export function getMetaOAuthUrl(userId: string): string {
  if (!userId) {
    throw new Error('userId is required for OAuth URL generation');
  }

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error('Invalid userId format. Expected UUID format.');
  }

  const state = generateMetaOAuthState(userId);
  const clientId = '891623109984411';
  const redirectUri = 'https://n8n.srv1181726.hstgr.cloud/webhook/Meta-Callback';
  const scope = 'ads_management,ads_read,business_management,pages_read_engagement,pages_show_list,instagram_basic,ads_read,business_management,catalog_management';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scope,
    state: state,
  });

  const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;

  console.log('[OAuth URL] Generated OAuth URL with state for user:', userId.slice(0, 8) + '...');

  return oauthUrl;
}