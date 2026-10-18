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

    if (!cleanText) {
      console.log('[Speech] Empty text, skipping');
      return;
    }

    console.log('[Speech] Speaking:', cleanText.substring(0, 50), 'lang:', language);

    Speech.stop();
    setSpeaking(true);

    Speech.speak(cleanText, {
      language,
      rate: 0.85,
      onStart: () => console.log('[Speech] Started'),
      onDone: () => {
        console.log('[Speech] Done');
        setSpeaking(false);
      },
      onError: (err) => {
        console.error('[Speech] Error:', err);
        setSpeaking(false);
      },
    });
  }, []);

  const stop = useCallback(() => {
    Speech.stop();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}
