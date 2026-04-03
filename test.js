import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
const supabase = createClient(
  "https://avzyuhhbmzhxqksnficn.supabase.co",
  process.env.SUPABASE_ACCESS_TOKEN
);

async function test() {
  const { data, error } = await supabase.functions.invoke('get-meta-campaigns', {
      body: { userId: "e3ddb575-b6d8-4a6c-94cc-a12feaa16d84" } // Wait, I need the actual user ID!
  });
  console.log(JSON.stringify(data, null, 2));
}
test();
