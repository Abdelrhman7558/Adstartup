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

        // Verify token matches the userId (or just rely on the fact that if they have a valid token, it belongs to them)
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
        if (userError || !user) {
            throw new Error("Invalid token");
        }

        // Explicitly check that the user is disconnecting their own account
        if (user.id !== userId) {
            throw new Error("Unauthorized to disconnect this account");
        }

        console.log(`[disconnect-meta] Deleting Meta connection for user ${userId}`);

        const { error: deleteError } = await supabaseAdmin
            .from("meta_connections")
            .delete()
            .eq("user_id", userId);

        if (deleteError) {
            console.error("[disconnect-meta] Supabase delete error:", deleteError);
            throw deleteError;
        }

        // Optional: also clean up any cached campaigns/adsets/ads or let them persist contextually until reconnected.
        // For now, we will explicitly delete the cache to ensure no orphaned data shown.
        console.log(`[disconnect-meta] Cleaning up cached assets for user ${userId}`);
        await supabaseAdmin.from("meta_campaigns").delete().eq("user_id", userId);
        await supabaseAdmin.from("meta_adsets").delete().eq("user_id", userId);
        await supabaseAdmin.from("meta_ads").delete().eq("user_id", userId);
        await supabaseAdmin.from("meta_account_selections").delete().eq("user_id", userId);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        console.error("[disconnect-meta] Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
