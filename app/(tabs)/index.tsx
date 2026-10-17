import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { decksDao, studySessionsDao } from '@/src/lib/database';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import type { Deck } from '@/src/types';

export default function HomeScreen() {
  const c = useThemeColors();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [todayStats, setTodayStats] = useState({ cardsStudied: 0, cardsCorrect: 0, totalTime: 0 });
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [allDecks, stats, currentStreak] = await Promise.all([
      decksDao.getAllDecks(),
      studySessionsDao.getTodayStats(),
      studySessionsDao.getStreak(),
    ]);
    setDecks(allDecks);
    setTodayStats(stats);
    setStreak(currentStreak);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totalDue = decks.reduce((sum, d) => sum + d.dueCount + d.newCount, 0);
  const accuracy =
    todayStats.cardsStudied > 0
      ? Math.round((todayStats.cardsCorrect / todayStats.cardsStudied) * 100)
      : 0;
  const minutes = Math.round(todayStats.totalTime / 60);
  const dueDecks = decks.filter((d) => d.dueCount > 0 || d.newCount > 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: c.text }]}>Reki</Text>
        <Text style={[styles.date, { color: c.textSecondary }]}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {[
          { value: totalDue, label: 'Due today', color: c.primary },
          { value: todayStats.cardsStudied, label: 'Studied', color: c.primary },
          { value: `${accuracy}%`, label: 'Accuracy', color: c.success },
          { value: streak, label: 'Streak', color: c.danger },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {todayStats.cardsStudied > 0 && (
        <View style={[styles.timeCard, { backgroundColor: c.primaryLight + '20' }]}>
          <Text style={[styles.timeText, { color: c.primary }]}>
            {minutes > 0 ? `${minutes} min` : `${todayStats.totalTime}s`} studied today
          </Text>
        </View>
      )}

      {dueDecks.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Ready to study</Text>
          {dueDecks.map((deck) => (
            <Pressable
              key={deck.id}
              style={[styles.deckRow, { backgroundColor: c.surface }]}
              onPress={() => router.push(`/study/${deck.id}`)}
            >
              <View style={styles.deckInfo}>
                <Text style={[styles.deckName, { color: c.text }]}>{deck.name}</Text>
                <Text style={[styles.deckCount, { color: c.textSecondary }]}>
                  {deck.newCount > 0 ? `${deck.newCount} new · ` : ''}
                  {deck.dueCount} due
                </Text>
              </View>
              <Text style={[styles.arrow, { color: c.border }]}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      {dueDecks.length === 0 && decks.length > 0 && (
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={[styles.doneText, { color: c.text }]}>All caught up!</Text>
          <Text style={[styles.doneSubtext, { color: c.textSecondary }]}>
            No cards due right now
          </Text>
        </View>
      )}

      {decks.length === 0 && (
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>📚</Text>
          <Text style={[styles.doneText, { color: c.text }]}>Welcome to Reki</Text>
          <Text style={[styles.doneSubtext, { color: c.textSecondary }]}>
            Go to Decks tab to create your first deck
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 32, fontWeight: '700' },
  date: { fontSize: 14, marginTop: 4 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 4 },
  timeCard: { borderRadius: 10, padding: 12, alignItems: 'center', marginBottom: 24 },
  timeText: { fontSize: 14, fontWeight: '500' },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  deckRow: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  deckInfo: { flex: 1 },
  deckName: { fontSize: 16, fontWeight: '500' },
  deckCount: { fontSize: 13, marginTop: 2 },
  arrow: { fontSize: 24, marginLeft: 8 },
  doneCard: { alignItems: 'center', marginTop: 40, padding: 24 },
  doneEmoji: { fontSize: 40, marginBottom: 12 },
  doneText: { fontSize: 20, fontWeight: '600' },
  doneSubtext: { fontSize: 14, marginTop: 6 },
});
