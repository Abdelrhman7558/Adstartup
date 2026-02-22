import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OAuthState {
  userId: string;
  timestamp: number;
}

const META_APP_ID = "891623109984411";
const META_APP_SECRET = "8f6fff4ae8d38941f44ca40211ce1239";
const FB_API_VERSION = "v19.0";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Redirect user back to frontend after completion
    const redirectBase = "https://the-adagent.com/meta-callback"; // Adjust as needed

    if (error) {
      console.error("[OAuth] Meta error:", error);
      return Response.redirect(`${redirectBase}?error=${error}`, 302);
    }

    if (!code || !state) {
      console.error("[OAuth] Missing code or state");
      return Response.redirect(`${redirectBase}?error=invalid_request`, 302);
    }

    // ─── Phase 1: Decode State ───────────────────────────────────────
    let decodedState: OAuthState;
    try {
      // Handle URL-encoded base64 if necessary
      const decodedUrlState = decodeURIComponent(state);
      const stateString = atob(decodedUrlState);

      // Handle "USER_ID:TIMESTAMP" format OR JSON format
      if (stateString.includes(':')) {
        const [userId, timestamp] = stateString.split(':');
        decodedState = { userId, timestamp: parseInt(timestamp) };
      } else {
        decodedState = JSON.parse(stateString);
      }
    } catch (err) {
      console.error("[OAuth] State decode failed:", err);
      return Response.redirect(`${redirectBase}?error=invalid_state`, 302);
    }

    const { userId } = decodedState;
    console.log(`[OAuth] Processing callback for user: ${userId}`);

    // ─── Phase 2: Token Exchange ─────────────────────────────────────

    // 1. Exchange 'code' for short-lived token
    const callbackUrl = `${url.origin}${url.pathname}`;
    const tokenUrl = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(callbackUrl)}&client_secret=${META_APP_SECRET}&code=${code}`;

    const shortTokenRes = await fetch(tokenUrl);
    const shortTokenData = await shortTokenRes.json();

    if (!shortTokenRes.ok) {
      console.error("[OAuth] Short token exchange failed:", shortTokenData);
      return Response.redirect(`${redirectBase}?error=token_exchange_failed`, 302);
    }

    const shortToken = shortTokenData.access_token;

    // 2. Exchange short-lived token for long-lived token (60 days)
    const longTokenUrl = `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;

    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();

    if (!longTokenRes.ok) {
      console.error("[OAuth] Long token exchange failed:", longTokenData);
      return Response.redirect(`${redirectBase}?error=long_token_failed`, 302);
    }

    const longToken = longTokenData.access_token;
    console.log("[OAuth] Successfully obtained long-lived token");

    // ─── Phase 3: Data Discovery (Discovery Node logic) ──────────────

    const results = {
      ad_accounts: [] as any[],
      pixels: [] as any[],
      catalogs: [] as any[]
    };

    // 1. Fetch Ad Accounts
    const accountsRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/me/adaccounts?fields=id,name,account_status,currency&limit=100&access_token=${longToken}`);
    if (accountsRes.ok) {
      const data = await accountsRes.json();
      results.ad_accounts = data.data || [];
    }

    // 2. Fetch Pixels (Iterate through ad accounts to find linked pixels)
    for (const acc of results.ad_accounts.slice(0, 5)) { // Limit to first 5 for speed, or fetch all if needed
      const pixelsRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${acc.id}/adspixels?fields=id,name,ad_account_id&access_token=${longToken}`);
      if (pixelsRes.ok) {
        const data = await pixelsRes.json();
        results.pixels.push(...(data.data || []));
      }
    }

    // 3. Fetch Catalogs (Via Businesses)
    const businessRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/me/businesses?access_token=${longToken}`);
    if (businessRes.ok) {
      const bizData = await businessRes.json();
      const businesses = bizData.data || [];
      for (const biz of businesses.slice(0, 3)) {
        const catRes = await fetch(`https://graph.facebook.com/${FB_API_VERSION}/${biz.id}/owned_product_catalogs?access_token=${longToken}`);
        if (catRes.ok) {
          const data = await catRes.json();
          results.catalogs.push(...(data.data || []));
        }
      }
    }

    // Deduplicate pixels and catalogs
    const seenPixels = new Set();
    results.pixels = results.pixels.filter(p => {
      if (seenPixels.has(p.id)) return false;
      seenPixels.add(p.id);
      return true;
    });

    const seenCatalogs = new Set();
    results.catalogs = results.catalogs.filter(c => {
      if (seenCatalogs.has(c.id)) return false;
      seenCatalogs.add(c.id);
      return true;
    });

    // ─── Phase 4: Database Persistence ───────────────────────────────

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Save connection & long token
    await supabase.from("meta_connections").upsert({
      user_id: userId,
      access_token: longToken,
      is_connected: true,
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    // 2. Save discovered options for selection (JSON data column)
    // We store the lists in meta_account_selections as preliminary data
    await supabase.from("meta_account_selections").upsert({
      user_id: userId,
      selection_completed: false,
      webhook_response: {
        discovered_at: new Date().toISOString(),
        ad_accounts: results.ad_accounts,
        pixels: results.pixels,
        catalogs: results.catalogs
      },
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    console.log(`[OAuth] Discovery complete. Found ${results.ad_accounts.length} accounts, ${results.pixels.length} pixels, ${results.catalogs.length} catalogs.`);

    // ─── Final Redirect ──────────────────────────────────────────────
    return Response.redirect(`${redirectBase}?meta_connected=true&user_id=${userId}`, 302);

  } catch (err: any) {
    console.error("[OAuth] Global callback error:", err.message);
    return Response.redirect(`https://the-adagent.com/meta-callback?error=server_error`, 302);
  }
});
