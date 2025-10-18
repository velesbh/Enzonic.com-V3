import { env } from './env';

export interface TranslationHistoryItem {
  id: number;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  createdAt: string;
}

export interface SaveTranslationRequest {
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: string;
}

// Translate text using the translation API
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  try {
    const response = await fetch(`${env.API_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        source: sourceLang,
        target: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      translatedText: data.translatedText || data.translation || text,
      sourceLang,
      targetLang,
    };
  } catch (error) {
    console.error('Error translating text:', error);
    // Fallback: return original text if translation fails
    return {
      translatedText: text,
      sourceLang,
      targetLang,
    };
  }
}

// Save translation to history
export async function saveTranslationToHistory(translation: SaveTranslationRequest, getToken: () => Promise<string | null>): Promise<boolean> {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('No auth token available, skipping history save');
      return false;
    }

    const response = await fetch(`${env.API_URL}/api/translations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(translation),
    });

    if (!response.ok) {
      throw new Error(`Failed to save translation: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error saving translation to history:', error);
    return false;
  }
}

// Get translation history
export async function getTranslationHistory(getToken: () => Promise<string | null>): Promise<TranslationHistoryItem[]> {
  try {
    const token = await getToken();
    if (!token) {
      console.warn('No auth token available, returning empty history');
      return [];
    }

    const response = await fetch(`${env.API_URL}/api/translations/history`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch translation history: ${response.statusText}`);
    }

    const data = await response.json();
    return data.history || [];
  } catch (error) {
    console.error('Error fetching translation history:', error);
    return [];
  }
}