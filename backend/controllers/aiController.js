const https = require('https');
const fs = require('fs');
const path = require('path');

const generateSuggestion = async (req, res) => {
  const { prompt, context } = req.body;
  
  let geminiKey = process.env.GEMINI_API_KEY;
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.+)/);
    if (match && match[1]) {
      geminiKey = match[1].trim();
    }
  } catch(e) {
    // Ignore, fallback to process.env
  }
  
  if (geminiKey) {
    try {
      const payload = JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a helpful AI assistant inside a collaborative document editor (CollabX).
            
Context from the document: 
"${context}"

User Request: "${prompt}"

Provide a concise, direct, and highly helpful response or continuation text. Do not use markdown if the user is asking to continue a sentence.`
          }]
        }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': payload.length
        }
      };

      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.error) {
              return res.status(400).json({ message: data.error.message });
            }
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
            res.json({ suggestion: aiText });
          } catch(e) {
            res.status(500).json({ message: "Failed to parse AI response" });
          }
        });
      });

      request.on('error', (e) => res.status(500).json({ message: e.message }));
      request.write(payload);
      request.end();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  } else {
    // Fallback Mock
    res.json({ suggestion: `(Mock Mode): I perceive you want me to expand on "${prompt}". To use real AI generation, please acquire a free Google Gemini API key and add it to your .env file as GEMINI_API_KEY.` });
  }
};

module.exports = { generateSuggestion };
