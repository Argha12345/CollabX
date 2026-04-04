const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const envContent = typeof fs !== 'undefined' ? fs.readFileSync(envPath, 'utf8') : '';
const match = envContent.match(/GEMINI_API_KEY=(.+)/);
const geminiKey = match ? match[1].trim() : process.env.GEMINI_API_KEY;

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${geminiKey}`,
  method: 'GET'
};

const req = https.request(options, (response) => {
  let body = '';
  response.on('data', chunk => body += chunk);
  response.on('end', () => {
     console.log("Status Code:", response.statusCode);
     try {
       const parsed = JSON.parse(body);
       console.log("Supported Models:", parsed.models?.map(m => m.name));
     } catch(e) {
       console.log("Raw Body:", body);
     }
  });
});

req.on('error', (e) => console.log("Request error:", e));
req.end();
