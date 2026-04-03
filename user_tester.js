import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const supabase = createClient(
  "https://avzyuhhbmzhxqksnficn.supabase.co",
  process.env.SUPABASE_ACCESS_TOKEN // service role key
);

async function run() {
    const { data: users, error: err } = await supabase.auth.admin.listUsers();
    if (err) {
        console.error("Auth err:", err);
        return;
    }
    const target = users.users.find(u => u.email === "jihadalcc@gmail.com");
    if (!target) {
        console.error("User not found");
        return;
    }
    console.log("Found user ID:", target.id);
    
    // Now call function inside edge
    const { data, error } = await supabase.functions.invoke('get-meta-campaigns', {
        body: { userId: target.id }
    });
    
    if (error) {
        console.error("Edge fn error:", error);
        return;
    }
    
    const campaigns = data.recent_campaigns || [];
    console.log("Total campaigns:", campaigns.length);
    if (campaigns.length > 0) {
        console.log("First campaign sample:");
        console.log("account_name:", campaigns[0].account_name);
        console.log("ad_account_id:", campaigns[0].ad_account_id);
    }
}
run();
