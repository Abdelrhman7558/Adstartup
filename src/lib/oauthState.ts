export interface OAuthState {
  userId: string;
  timestamp: number;
  nonce: string;
}

export function generateOAuthState(userId: string): string {
  const timestamp = Date.now();
  const nonce = generateRandomNonce();

  const state: OAuthState = {
    userId,
    timestamp,
    nonce,
  };

  const stateString = JSON.stringify(state);
  const encoded = btoa(stateString);

  return encoded;
}

export function verifyOAuthState(encodedState: string, userId: string, maxAgeMs: number = 10 * 60 * 1000): boolean {
  try {
    const stateString = atob(encodedState);
    const state: OAuthState = JSON.parse(stateString);

    if (state.userId !== userId) {
      console.error('[OAuth] State user ID mismatch');
      return false;
    }

    const now = Date.now();
    const age = now - state.timestamp;

    if (age > maxAgeMs) {
      console.error('[OAuth] State token expired:', age, 'ms');
      return false;
    }

    if (!state.nonce || state.nonce.length < 16) {
      console.error('[OAuth] Invalid nonce in state');
      return false;
    }

    return true;
  } catch (err) {
    console.error('[OAuth] State verification error:', err);
    return false;
  }
}

export function decodeOAuthState(encodedState: string): OAuthState | null {
  try {
    const stateString = atob(encodedState);
    const state: OAuthState = JSON.parse(stateString);
    return state;
  } catch (err) {
    console.error('[OAuth] State decode error:', err);
    return null;
  }
}

function generateRandomNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let nonce = '';
  const array = new Uint8Array(32);

  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  for (let i = 0; i < array.length; i++) {
    nonce += chars[array[i] % chars.length];
  }

  return nonce;
}

export const META_OAUTH_CONFIG = {
  clientId: '891623109984411',
  redirectUri: 'https://avzyuhhbmzhxqksnficn.supabase.co/functions/v1/meta-oauth-callback',
  scope: 'ads_management,ads_read,business_management,pages_manage_ads,pages_read_engagement,catalog_management',
  version: 'v19.0',
};

export const N8N_WEBHOOKS = {
  checkConnection: 'https://n8n.srv1181726.hstgr.cloud/webhook-test/Check',
  metaCallback: 'https://n8n.srv1181726.hstgr.cloud/webhook/Meta-Callback',
  uploadAsset: 'https://n8n.srv1181726.hstgr.cloud/webhook-test/Assest',
};

export function buildMetaOAuthUrl(userId: string): string {
  const params = new URLSearchParams({
    client_id: META_OAUTH_CONFIG.clientId,
    redirect_uri: META_OAUTH_CONFIG.redirectUri,
    scope: META_OAUTH_CONFIG.scope,
    state: btoa(`${userId}:${Date.now()}:${window.location.origin}`),
    response_type: 'code',
  });

  return `https://www.facebook.com/${META_OAUTH_CONFIG.version}/dialog/oauth?${params.toString()}`;
}

export async function checkMetaConnectionStatus(userId: string): Promise<boolean> {
  try {
    const response = await fetch(N8N_WEBHOOKS.checkConnection, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      console.error('[N8N] Check connection failed:', response.status);
      return false;
    }

    const data = await response.json();
    return data.connected === true;
  } catch (err) {
    console.error('[N8N] Check connection error:', err);
    return false;
  }
}
