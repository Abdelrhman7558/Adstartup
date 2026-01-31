import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OAuthState {
  userId: string;
  timestamp: number;
  nonce: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    const referer = req.headers.get("referer") || "";
    const origin = new URL(referer).origin || "http://localhost:5173";

    if (error) {
      console.error("[OAuth] Meta error:", error);
      const redirectUrl = new URL(`${origin}/meta-callback`);
      redirectUrl.searchParams.set("error", error);
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl.toString(),
          ...corsHeaders,
        },
      });
    }

    if (!code || !state) {
      console.error("[OAuth] Missing code or state");
      const redirectUrl = new URL(`${origin}/meta-callback`);
      redirectUrl.searchParams.set("error", "invalid_request");
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl.toString(),
          ...corsHeaders,
        },
      });
    }

    let decodedState: OAuthState;
    try {
      const stateString = atob(state);
      decodedState = JSON.parse(stateString);
    } catch (err) {
      console.error("[OAuth] State decode failed:", err);
      const redirectUrl = new URL(`${origin}/meta-callback`);
      redirectUrl.searchParams.set("error", "invalid_state");
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl.toString(),
          ...corsHeaders,
        },
      });
    }

    const now = Date.now();
    const age = now - decodedState.timestamp;
    const maxAge = 10 * 60 * 1000;

    if (age > maxAge) {
      console.error("[OAuth] State token expired");
      const redirectUrl = new URL(`${origin}/meta-callback`);
      redirectUrl.searchParams.set("error", "state_expired");
      return new Response(null, {
        status: 302,
        headers: {
          "Location": redirectUrl.toString(),
          ...corsHeaders,
        },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const existingRecord = await supabase
      .from("Connected Meta Account")
      .select("*")
      .eq("User ID", decodedState.userId)
      .maybeSingle();

    if (existingRecord.error && existingRecord.error.code !== "PGRST116") {
      throw existingRecord.error;
    }

    if (existingRecord.data) {
      const { error: updateError } = await supabase
        .from("Connected Meta Account")
        .update({
          Connected: true,
        })
        .eq("User ID", decodedState.userId);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("Connected Meta Account")
        .insert({
          "User ID": decodedState.userId,
          Connected: true,
        });

      if (insertError) throw insertError;
    }

    try {
      await fetch("https://n8n.srv1181726.hstgr.cloud/webhook/Meta-Callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: decodedState.userId,
          code,
          action: "connect",
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (webhookErr) {
      console.error("[OAuth] Webhook error:", webhookErr);
    }

    const redirectUrl = new URL(`${origin}/meta-callback`);
    redirectUrl.searchParams.set("meta_connected", "true");
    return new Response(null, {
      status: 302,
      headers: {
        "Location": redirectUrl.toString(),
        ...corsHeaders,
      },
    });
  } catch (err) {
    console.error("[OAuth] Callback error:", err);
    const redirectUrl = new URL("http://localhost:5173/meta-callback");
    redirectUrl.searchParams.set("error", "server_error");
    return new Response(null, {
      status: 302,
      headers: {
        "Location": redirectUrl.toString(),
        ...corsHeaders,
      },
    });
  }
});
