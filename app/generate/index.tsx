import { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { generateFlashcards, getApiKey, type GeneratedCard } from '@/src/lib/ai';
import { cardsDao, decksDao } from '@/src/lib/database';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import { useDecksStore } from '@/src/stores/decks.store';

export default function GenerateScreen() {
  const c = useThemeColors();
  const { loadDecks } = useDecksStore();
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState('10');
  const [language, setLanguage] = useState('en');
  const [generating, setGenerating] = useState(false);
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;

    const apiKey = await getApiKey();
    if (!apiKey) {
      Alert.alert('API Key Required', 'Go to Settings tab to configure your free Gemini API key.', [
        { text: 'OK' },
      ]);
      return;
    }

    setGenerating(true);
    setError(null);
    setCards([]);

    try {
      const generated = await generateFlashcards(topic.trim(), Number(count) || 10, language);
      setCards(generated);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [topic, count, language]);

  const handleSaveToDeck = useCallback(async () => {
    if (cards.length === 0) return;

    try {
      const deckName = `AI: ${topic.trim().substring(0, 40)}`;
      const deckId = await decksDao.createDeck(
        deckName,
        `Generated with AI (${cards.length} cards)`,
      );

      for (const card of cards) {
        await cardsDao.createCard(deckId, card.front, card.back);
      }

      await loadDecks();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved!', `${cards.length} cards added to "${deckName}"`, [
        { text: 'Go to Decks', onPress: () => router.replace('/(tabs)/decks') },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message);
    }
  }, [cards, topic, loadDecks]);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'de', label: 'German' },
    { code: 'ja', label: 'Japanese' },
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Stack.Screen options={{ title: 'AI Generate' }} />

      <View style={styles.form}>
        <Text style={[styles.label, { color: c.text }]}>Topic</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
          placeholder="e.g., AWS S3 concepts, English phrasal verbs, React hooks..."
          placeholderTextColor={c.textSecondary}
          value={topic}
          onChangeText={setTopic}
          multiline
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: c.text }]}>Cards</Text>
            <TextInput
              style={[
                styles.input,
                styles.smallInput,
                { backgroundColor: c.surface, color: c.text },
              ]}
              value={count}
              onChangeText={setCount}
              keyboardType="number-pad"
              placeholderTextColor={c.textSecondary}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={[styles.label, { color: c.text }]}>Language</Text>
            <View style={styles.langRow}>
              {languages.map((lang) => (
                <Pressable
                  key={lang.code}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: language === lang.code ? c.primary : c.surface,
                    },
                  ]}
                  onPress={() => setLanguage(lang.code)}
                >
                  <Text
                    style={[
                      styles.langText,
                      { color: language === lang.code ? '#FFFFFF' : c.textSecondary },
                    ]}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.generateBtn, (!topic.trim() || generating) && styles.btnDisabled]}
          onPress={handleGenerate}
          disabled={!topic.trim() || generating}
        >
          {generating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.generateBtnText}>Generate with AI</Text>
          )}
        </Pressable>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>

      {cards.length > 0 && (
        <View style={styles.results}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.resultsTitle, { color: c.text }]}>
              {cards.length} cards generated
            </Text>
            <Pressable style={styles.saveBtn} onPress={handleSaveToDeck}>
              <Text style={styles.saveBtnText}>Save to Deck</Text>
            </Pressable>
          </View>

          <FlatList
            data={cards}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={[styles.cardPreview, { backgroundColor: c.surface }]}>
                <Text style={[styles.cardFront, { color: c.text }]}>{item.front}</Text>
                <Text style={[styles.cardBack, { color: c.textSecondary }]}>{item.back}</Text>
              </View>
            )}
            contentContainerStyle={styles.cardList}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
  input: {
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  smallInput: { minHeight: 0 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  langRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langText: { fontSize: 12, fontWeight: '500' },
  generateBtn: {
    backgroundColor: '#6C5CE7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.5 },
  generateBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  errorBox: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  errorText: { color: '#FF7675', fontSize: 14 },
  results: { flex: 1 },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  resultsTitle: { fontSize: 16, fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  cardList: { paddingHorizontal: 16, paddingBottom: 40 },
  cardPreview: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardFront: { fontSize: 16, fontWeight: '500' },
  cardBack: { fontSize: 14, marginTop: 6, lineHeight: 20 },
});
