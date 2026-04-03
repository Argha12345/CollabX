// @desc    Generate AI suggestions
// @route   POST /api/ai/suggest
// @access  Private
const generateSuggestion = async (req, res) => {
  const { prompt, context } = req.body;
  try {
    // If OpenAI API key is set, use it. Otherwise, return mock data.
    if (process.env.OPENAI_API_KEY) {
      res.json({ suggestion: `AI parsed: "${prompt}". (Requires full OpenAI setup to function)` });
    } else {
      res.json({ suggestion: `Mock AI Suggestion for: "${prompt}". Please set OPENAI_API_KEY in backend .env to see actual results.` });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { generateSuggestion };
