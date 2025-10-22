import { saveTranslation, getTranslationHistory, recordStatistic } from '../database/config.js';

// Save a new translation
export async function saveTranslationController(req, res) {
  try {
    const { sourceText, translatedText, sourceLang, targetLang, type = 'text', fileName } = req.body;
    const userId = req.userId;
    
    if (!sourceText || !translatedText || !sourceLang || !targetLang) {
      return res.status(400).json({ 
        error: 'Missing required fields: sourceText, translatedText, sourceLang, targetLang' 
      });
    }
    
    const translationId = await saveTranslation(
      userId, 
      sourceText, 
      translatedText, 
      sourceLang, 
      targetLang,
      type,
      fileName
    );
    
    // Record translation statistic
    await recordStatistic('translation_request', {
      userId,
      sourceLang,
      targetLang,
      textLength: sourceText.length,
      type,
      timestamp: new Date().toISOString()
    }, 'translate');
    
    res.json({ 
      success: true, 
      translationId,
      message: 'Translation saved successfully' 
    });
  } catch (error) {
    console.error('Error saving translation:', error);
    
    // Record error statistic
    await recordStatistic('error_occurred', {
      error: error.message,
      endpoint: '/api/translations',
      userId: req.userId
    });
    
    res.status(500).json({ error: 'Failed to save translation' });
  }
}

// Get translation history for the authenticated user
export async function getTranslationHistoryController(req, res) {
  try {
    const userId = req.userId;
    const history = await getTranslationHistory(userId);
    
    // Format the response
    const formattedHistory = history.map(item => ({
      id: item.id,
      sourceText: item.source_text,
      translatedText: item.translated_text,
      sourceLang: item.source_language,
      targetLang: item.target_language,
      createdAt: item.created_at,
      type: item.type || 'text',
      fileName: item.file_name
    }));
    
    res.json({ 
      success: true, 
      history: formattedHistory 
    });
  } catch (error) {
    console.error('Error fetching translation history:', error);
    res.status(500).json({ error: 'Failed to fetch translation history' });
  }
}