
import fs from 'fs';
import https from 'https';

const url = "https://avzyuhhbmzhxqksnficn.supabase.co/rest/v1/meta_account_selections?select=user_id,webhook_response,updated_at&order=updated_at.desc&limit=1";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2enl1aGhibXpoeHFrc25maWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTE4OTQsImV4cCI6MjA3OTM2Nzg5NH0.agjZAJJex4Zo_m0mQL6TUfe6d-VHhbuSJe8f7IXg0ck";

const options = {
    headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        fs.writeFileSync('error_log.json', data);
        console.log('Saved to error_log.json');
    });
}).on('error', (err) => {
    console.log('Error: ' + err.message);
});
