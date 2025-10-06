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