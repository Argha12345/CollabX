const { Document, Workspace, DocumentLog, KanbanCard } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');

// --- Robust key loader ---
const getGeminiKey = () => {
  let key = process.env.GEMINI_API_KEY;
  try {
    const envPath = path.resolve(__dirname, '../.env');
    const match = fs.readFileSync(envPath, 'utf8').match(/GEMINI_API_KEY=(.+)/);
    if (match && match[1]?.trim()) key = match[1].trim();
  } catch (e) {}
  return key;
};

// --- Core Gemini caller using raw HTTPS with full debug ---
const callGemini = (geminiKey, prompt) => {
  return new Promise((resolve, reject) => {
    const https = require('https');

    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          if (data.error) {
            console.error('[Gemini API Error]', data.error);
            if (data.error.code === 429) {
              return reject(new Error('RATE_LIMIT'));
            }
            return reject(new Error(data.error.message));
          }
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) {
            console.error('[Gemini] Empty response:', JSON.stringify(data).substring(0, 500));
            return reject(new Error('Empty AI response'));
          }
          resolve(text);
        } catch (e) {
          console.error('[Gemini Parse Error]', e.message, body.substring(0, 300));
          reject(e);
        }
      });
    });

    req.on('error', (e) => {
      console.error('[Gemini Request Error]', e.message);
      reject(e);
    });

    req.write(payload);
    req.end();
  });
};

// ─────────────────────────────────────────
// 1. Document AI Suggestion
// ─────────────────────────────────────────
const generateSuggestion = async (req, res) => {
  const { prompt, context } = req.body;
  const geminiKey = getGeminiKey();

  if (!geminiKey) {
    return res.status(500).json({ message: 'GEMINI_API_KEY not configured.' });
  }

  const fullPrompt = `You are a helpful AI writing assistant inside CollabX.

Document context:
"${context || 'No context provided.'}"

User request: "${prompt}"

Provide a direct, concise, helpful continuation or response. No markdown if the user wants a continuation.`;

  try {
    const text = await callGemini(geminiKey, fullPrompt);
    res.json({ suggestion: text });
  } catch (err) {
    console.error('[generateSuggestion]', err.message);
    if (err.message === 'RATE_LIMIT') {
      return res.status(429).json({ message: 'The AI service is currently busy. Please try again in a moment.' });
    }
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 2. Workspace Assistant (Query Documents)
// ─────────────────────────────────────────
const queryWorkspace = async (req, res) => {
  const { workspaceId, query } = req.body;
  if (!workspaceId || !query) {
    return res.status(400).json({ message: 'workspaceId and query are required.' });
  }

  const geminiKey = getGeminiKey();
  if (!geminiKey) {
    return res.status(500).json({ message: 'GEMINI_API_KEY not configured.' });
  }

  try {
    const documents = await Document.findAll({ where: { workspaceId } });

    if (documents.length === 0) {
      return res.json({ answer: 'This workspace has no documents yet. Create some documents first and I can help you analyze them!' });
    }

    const combinedContent = documents
      .map(doc => `## ${doc.title}\n${doc.content ? doc.content.replace(/<[^>]+>/g, ' ').trim() : '(Empty document)'}`)
      .join('\n\n---\n\n')
      .substring(0, 10000);

    const fullPrompt = `You are a Workspace Assistant for CollabX, a collaborative document app.

The user is asking a question about their workspace documents. Here are all documents in the workspace:

${combinedContent}

User Question: "${query}"

Answer based only on the provided documents. If the answer cannot be found in the documents, say so clearly. Be helpful and concise.`;

    const text = await callGemini(geminiKey, fullPrompt);
    res.json({ answer: text });
  } catch (err) {
    console.error('[queryWorkspace]', err.message);
    if (err.message === 'RATE_LIMIT') {
      return res.json({ answer: 'The AI assistant is currently busy. Please try again in a moment.' });
    }
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// 3. AI Daily Standup Pulse
// ─────────────────────────────────────────
const getWorkspaceStandup = async (req, res) => {
  const { workspaceId } = req.body;
  if (!workspaceId) {
    return res.status(400).json({ message: 'workspaceId is required.' });
  }

  const geminiKey = getGeminiKey();
  if (!geminiKey) {
    return res.status(500).json({ message: 'GEMINI_API_KEY not configured.' });
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    // Fetch doc activity logs for this workspace
    let logLines = [];
    try {
      const logs = await DocumentLog.findAll({
        where: { createdAt: { [Op.gt]: yesterday } },
        include: [{ model: Document, where: { workspaceId }, required: true, attributes: ['title'] }]
      });
      logLines = logs.map(l => `- ${l.userName || 'A user'} ${(l.action || 'edited').toLowerCase()} "${l.Document?.title || 'a document'}"`);
    } catch (e) {
      console.warn('[Standup] Could not fetch logs:', e.message);
    }

    // All docs as context even if no logs
    const allDocs = await Document.findAll({ where: { workspaceId }, attributes: ['title', 'updatedAt'] });

    if (logLines.length === 0 && allDocs.length === 0) {
      return res.json({ standup: '📭 **All quiet today!** No documents or activity recorded in this workspace in the last 24 hours.' });
    }

    if (logLines.length === 0) {
      const docList = allDocs.map(d => `- "${d.title}" (last updated ${new Date(d.updatedAt).toLocaleDateString()})`).join('\n');
      return res.json({
        standup: `📋 **Workspace Overview**\n\nNo new activity in the last 24 hours. Here's what's in the workspace:\n\n${docList}`
      });
    }

    const fullPrompt = `You are a scrum master assistant for a collaborative app. Generate a short, friendly daily standup summary from the following team activity log (last 24 hours):

Activity Log:
${logLines.join('\n')}

Rules:
- 3-5 bullet points max
- Group by person if possible
- Be friendly and concise
- Start with an encouraging emoji`;

    const text = await callGemini(geminiKey, fullPrompt);
    res.json({ standup: text });
  } catch (err) {
    console.error('[getWorkspaceStandup]', err.message);
    if (err.message === 'RATE_LIMIT') {
      return res.json({ standup: '🔄 AI is currently busy. Click refresh in a moment to generate today\'s summary.' });
    }
    res.status(500).json({ message: err.message });
  }
};

module.exports = { generateSuggestion, queryWorkspace, getWorkspaceStandup };
