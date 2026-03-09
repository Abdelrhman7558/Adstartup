const https = require('https');
https.get('https://avzyuhhbmzhxqksnficn.supabase.co/functions/v1/meta-oauth-callback?code=abc&state=abc', (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Location:', res.headers.location);
    process.exit(0);
}).on('error', (e) => {
    console.error(e);
    process.exit(1);
});
