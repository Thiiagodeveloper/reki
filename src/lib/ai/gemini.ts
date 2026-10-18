import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent';
const STORAGE_KEY = 'reki_gemini_api_key';

export async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY);
}

export async function setApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, key);
}

export async function removeApiKey(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export interface GeneratedCard {
  front: string;
  back: string;
}

export async function generateFlashcards(
  topic: string,
  count: number = 10,
  language: string = 'en',
): Promise<GeneratedCard[]> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('Gemini API key not configured');

  const targetLang = language === 'en' ? 'English' : language === 'es' ? 'Spanish' : language;

  const prompt = `Generate ${count} flashcards for studying "${topic}".

For each card:
- "front": the question, term, or word (concise)
- "back": the answer with definition, example sentence, and translation if applicable

Format: Return ONLY a JSON array, no markdown, no explanation:
[{"front": "...", "back": "..."}]

If the topic is a language (e.g., English vocabulary, Spanish verbs), format the back as:
(part of speech) Definition
Example: "sentence using the word"
Translation: translation of the example

Language for content: ${targetLang}
Topic: ${topic}`;

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 400 || response.status === 403) {
      throw new Error('Invalid API key. Check your Gemini API key in Settings.');
    }
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) throw new Error('No response from Gemini');

  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Could not parse Gemini response');

  const cards: GeneratedCard[] = JSON.parse(jsonMatch[0]);
  return cards.filter((c) => c.front && c.back);
}

export async function explainCard(front: string, back: string): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('Gemini API key not configured');

  const prompt = `The student failed this flashcard:
Front: ${front}
Back: ${back}

Give a brief, clear explanation to help them remember this. Include:
1. A simple explanation of the concept
2. A memory tip or mnemonic
3. An additional example

Keep it under 100 words. Be friendly and encouraging.`;

  const response = await fetch(`${API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 512,
      },
    }),
  });

  if (!response.ok) throw new Error('Gemini API error');

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Could not generate explanation.';
}
