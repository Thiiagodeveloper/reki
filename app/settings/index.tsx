import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, Alert, Platform } from 'react-native';
import { Stack } from 'expo-router';

import { getApiKey, setApiKey, removeApiKey } from '@/src/lib/ai';
import { useThemeColors } from '@/src/hooks/useThemeColors';

export default function SettingsScreen() {
  const c = useThemeColors();
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getApiKey().then((k) => {
      if (k) {
        setKey(k);
        setHasKey(true);
      }
    });
  }, []);

  const handleSave = async () => {
    if (!key.trim()) return;
    await setApiKey(key.trim());
    setHasKey(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemove = () => {
    Alert.alert('Remove API Key?', 'AI features will stop working.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeApiKey();
          setKey('');
          setHasKey(false);
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>AI (Gemini)</Text>
        <Text style={[styles.description, { color: c.textSecondary }]}>
          Get a free API key from Google AI Studio to enable AI features (generate flashcards,
          explanations).
        </Text>
        <Text style={[styles.link, { color: c.primary }]}>https://aistudio.google.com/apikey</Text>

        <TextInput
          style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
          placeholder="Paste your Gemini API key here"
          placeholderTextColor={c.textSecondary}
          value={key}
          onChangeText={setKey}
          secureTextEntry={hasKey}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.saveBtn, !key.trim() && styles.btnDisabled]}
            onPress={handleSave}
            disabled={!key.trim()}
          >
            <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Key'}</Text>
          </Pressable>

          {hasKey && (
            <Pressable style={styles.removeBtn} onPress={handleRemove}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>About</Text>
        <Text style={[styles.description, { color: c.textSecondary }]}>
          Reki v1.0.0{'\n'}
          Open-source flashcard app{'\n'}
          FSRS spaced repetition algorithm
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  link: { fontSize: 13, marginBottom: 12 },
  input: {
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonRow: { flexDirection: 'row', gap: 12 },
  saveBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  btnDisabled: { opacity: 0.5 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  removeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  removeBtnText: { color: '#FF7675', fontSize: 14, fontWeight: '600' },
});
