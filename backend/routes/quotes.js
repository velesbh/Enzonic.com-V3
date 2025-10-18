import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// Get random quote
router.get('/random', async (req, res) => {
  try {
    const { maxLength = 150 } = req.query;
    
    const response = await fetch(`https://api.quotable.io/random?maxLength=${maxLength}`, {
      headers: {
        'User-Agent': 'Enzonic Search/1.0',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Quotable API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Quote fetch error:', error);
    
    // Return a fallback quote
    res.json({
      content: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      tags: ["inspirational"],
      _id: "fallback"
    });
  }
});

export default router;
