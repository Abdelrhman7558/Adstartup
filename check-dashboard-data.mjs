import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDashboardData() {
    console.log('--- Checking connection status ---');
    const { data: connections, error: connError } = await supabase      
        .from('meta_connections')
        .select('*')      
        .order('updated_at', { ascending: false })
        .limit(1);

    if (connError) {
        console.error("Error reading meta_connections:", connError);
        return;
    }

    if (connections && connections.length > 0) {
        const conn = connections[0];
        console.log("Found Meta Connection Record:", JSON.stringify(conn, null, 2));
        
        // Exact logic from ProductionDashboard.tsx
        const isConnected = !!(conn.is_connected && conn.ad_account_id);
        console.log("✅ Dashboard calculation 'isConnected' =", isConnected);
    } else {
        console.log("❌ No records found in meta_connections");
    }
}

checkDashboardData();
