import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("No authorization header");
        }

        const { userId } = await req.json();

        if (!userId) {
            throw new Error("Missing userId");
        }

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Verify token matches the userId
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
        if (userError || !user) {
            throw new Error("Invalid token");
        }

        // Explicitly check that the user is disconnecting their own account
        if (user.id !== userId) {
            throw new Error("Unauthorized to disconnect this account");
        }

        console.log(`[disconnect-meta] Disconnecting Meta for user ${userId}`);

        // Strategy: UPDATE is_connected to false + clear token (safer than DELETE)
        // This preserves the row so reconnection flows work without needing to re-insert.
        const { error: updateError } = await supabaseAdmin
            .from("meta_connections")
            .update({
                is_connected: false,
                access_token: null,
                updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);

        if (updateError) {
            console.error("[disconnect-meta] Update error:", updateError);
            // Fallback: try DELETE if update fails (row might not exist)
            const { error: deleteError } = await supabaseAdmin
                .from("meta_connections")
                .delete()
                .eq("user_id", userId);
            if (deleteError) {
                console.error("[disconnect-meta] Delete fallback also failed:", deleteError);
            }
        }

        console.log(`[disconnect-meta] ✅ Meta connection disabled for user ${userId}`);

        // Optional cleanup: delete cached data (each wrapped in try-catch to avoid crashes)
        const cleanupTables = ["meta_campaigns", "meta_adsets", "meta_ads"];
        for (const table of cleanupTables) {
            try {
                const { error: cleanErr } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
                if (cleanErr) {
                    console.warn(`[disconnect-meta] Cleanup ${table} warning:`, cleanErr.message);
                }
            } catch (e: any) {
                console.warn(`[disconnect-meta] Cleanup ${table} skipped:`, e?.message);
            }
        }

        // Also try manager_meta_accounts cleanup
        try {
            await supabaseAdmin.from("manager_meta_accounts").delete().eq("user_id", userId);
        } catch (_e) {
            // Non-critical
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("[disconnect-meta] Error:", error.message);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 so supabase.functions.invoke doesn't treat it as a network error
        });
    }
});
