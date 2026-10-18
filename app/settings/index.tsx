import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ScrollView,
  Switch,
} from 'react-native';
import { Stack } from 'expo-router';

import { getApiKey, setApiKey, removeApiKey } from '@/src/lib/ai';
import { getSettings, saveSettings, type UserSettings } from '@/src/lib/settings';
import { scheduleDailyReminder, cancelAllReminders } from '@/src/lib/notifications';
import { useThemeColors } from '@/src/hooks/useThemeColors';

export default function SettingsScreen() {
  const c = useThemeColors();
  const [key, setKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    getApiKey().then((k) => {
      if (k) {
        setKey(k);
        setHasKey(true);
      }
    });
    getSettings().then(setSettings);
  }, []);

  const handleSaveKey = async () => {
    if (!key.trim()) return;
    await setApiKey(key.trim());
    setHasKey(true);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveKey = () => {
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

  const updateSetting = async (update: Partial<UserSettings>) => {
    const updated = await saveSettings(update);
    setSettings(updated);

    if ('notificationsEnabled' in update) {
      if (update.notificationsEnabled) {
        await scheduleDailyReminder();
      } else {
        await cancelAllReminders();
      }
    }
    if ('notificationHour' in update || 'notificationMinute' in update) {
      if (settings?.notificationsEnabled) {
        await scheduleDailyReminder();
      }
    }
  };

  if (!settings) return null;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Study Limits</Text>
        <Text style={[styles.description, { color: c.textSecondary }]}>
          Control how many cards you study per session.
        </Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: c.text }]}>New cards per session</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: c.surface, color: c.text }]}
            value={String(settings.dailyNewCardLimit)}
            onChangeText={(v) => {
              const num = parseInt(v) || 0;
              updateSetting({ dailyNewCardLimit: num });
            }}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: c.text }]}>Review cards per session</Text>
          <TextInput
            style={[styles.numberInput, { backgroundColor: c.surface, color: c.text }]}
            value={String(settings.dailyReviewLimit)}
            onChangeText={(v) => {
              const num = parseInt(v) || 0;
              updateSetting({ dailyReviewLimit: num });
            }}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>Notifications</Text>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: c.text }]}>Daily reminder</Text>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSetting({ notificationsEnabled: v })}
            trackColor={{ true: c.primary }}
          />
        </View>

        {settings.notificationsEnabled && (
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: c.text }]}>Reminder time</Text>
            <View style={styles.timeRow}>
              <TextInput
                style={[styles.timeInput, { backgroundColor: c.surface, color: c.text }]}
                value={String(settings.notificationHour)}
                onChangeText={(v) => {
                  const h = Math.min(Math.max(parseInt(v) || 0, 0), 23);
                  updateSetting({ notificationHour: h });
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.timeSeparator, { color: c.text }]}>:</Text>
              <TextInput
                style={[styles.timeInput, { backgroundColor: c.surface, color: c.text }]}
                value={String(settings.notificationMinute).padStart(2, '0')}
                onChangeText={(v) => {
                  const m = Math.min(Math.max(parseInt(v) || 0, 0), 59);
                  updateSetting({ notificationMinute: m });
                }}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>AI (Gemini)</Text>
        <Text style={[styles.description, { color: c.textSecondary }]}>
          Free API key from Google AI Studio for AI features.
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
            onPress={handleSaveKey}
            disabled={!key.trim()}
          >
            <Text style={styles.saveBtnText}>{saved ? 'Saved!' : 'Save Key'}</Text>
          </Pressable>

          {hasKey && (
            <Pressable style={styles.removeBtn} onPress={handleRemoveKey}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={[styles.section, { marginBottom: 60 }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>About</Text>
        <Text style={[styles.description, { color: c.textSecondary }]}>
          Reki v1.0.0{'\n'}
          Open-source flashcard app{'\n'}
          FSRS spaced repetition algorithm
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  description: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  link: { fontSize: 13, marginBottom: 12 },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLabel: { fontSize: 15, flex: 1 },
  numberInput: {
    width: 70,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeInput: {
    width: 50,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  timeSeparator: { fontSize: 20, fontWeight: '600' },
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
