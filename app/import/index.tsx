import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';

import { importApkg, type ImportResult } from '@/src/lib/apkg';
import { useDecksStore } from '@/src/stores/decks.store';

export default function ImportScreen() {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { loadDecks } = useDecksStore();

  const handlePickFile = async () => {
    try {
      const docResult = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (docResult.canceled) return;

      const file = docResult.assets[0];
      if (!file.name.endsWith('.apkg')) {
        setError('Please select a valid .apkg file');
        return;
      }

      setImporting(true);
      setError(null);
      setResult(null);

      const importResult = await importApkg(file.uri);
      setResult(importResult);
      await loadDecks();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      setError((e as Error).message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Import Deck' }} />

      <View style={styles.content}>
        <Text style={styles.icon}>📦</Text>
        <Text style={styles.title}>Import Anki Deck</Text>
        <Text style={styles.subtitle}>
          Select a .apkg file from your device to import cards into Reki
        </Text>

        <Pressable
          style={[styles.importBtn, importing && styles.importBtnDisabled]}
          onPress={handlePickFile}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.importBtnText}>Select .apkg File</Text>
          )}
        </Pressable>

        {importing && (
          <Text style={styles.statusText}>Importing cards... this may take a moment</Text>
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Import Complete!</Text>
            <Text style={styles.resultLine}>Deck: {result.deckName}</Text>
            <Text style={styles.resultLine}>Cards imported: {result.cardsImported}</Text>
            {result.mediaImported > 0 && (
              <Text style={styles.resultLine}>Media files: {result.mediaImported}</Text>
            )}
            {result.errors.length > 0 && (
              <Text style={styles.resultWarning}>
                {result.errors.length} warning(s) during import
              </Text>
            )}

            <Pressable style={styles.doneBtn} onPress={() => router.replace('/(tabs)/decks')}>
              <Text style={styles.doneBtnText}>Go to Decks</Text>
            </Pressable>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 280,
  },
  importBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  importBtnDisabled: {
    opacity: 0.7,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: '#E8FFF7',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    width: '100%',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00B894',
    marginBottom: 12,
  },
  resultLine: {
    fontSize: 14,
    color: '#2D3436',
    marginBottom: 4,
  },
  resultWarning: {
    fontSize: 13,
    color: '#E17055',
    marginTop: 8,
  },
  doneBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorCard: {
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#FF7675',
  },
});
