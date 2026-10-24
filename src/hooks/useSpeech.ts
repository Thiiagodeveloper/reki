import * as Speech from 'expo-speech';
import { useCallback, useState } from 'react';

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string, language: string = 'en-US') => {
    const cleanText = text
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/[,;]/g, ' ')
      .trim();

    if (!cleanText) return;

    Speech.stop();
    setSpeaking(true);

    Speech.speak(cleanText, {
      language,
      rate: 0.85,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}
