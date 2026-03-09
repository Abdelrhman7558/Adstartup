const https = require('https');

const userId = '00000000-0000-0000-0000-000000000000';
const stateContent = `${userId}:${Date.now()}:http://localhost:5173`;
const state = Buffer.from(stateContent).toString('base64');

console.log('Sending state:', state);

https.get(`https://avzyuhhbmzhxqksnficn.supabase.co/functions/v1/meta-oauth-callback?code=fakecode&state=${encodeURIComponent(state)}`, (res) => {
    console.log('Status Code:', res.statusCode);
    console.log('Location:', res.headers.location);
    process.exit(0);
}).on('error', (e) => {
    console.error(e);
    process.exit(1);
});
