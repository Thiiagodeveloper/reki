import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { decksDao, studySessionsDao } from '@/src/lib/database';
import type { Deck } from '@/src/types';

export default function HomeScreen() {
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
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Reki</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalDue}</Text>
          <Text style={styles.statLabel}>Due today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{todayStats.cardsStudied}</Text>
          <Text style={styles.statLabel}>Studied</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#00B894' }]}>{accuracy}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#E17055' }]}>{streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {todayStats.cardsStudied > 0 && (
        <View style={styles.timeCard}>
          <Text style={styles.timeText}>
            {minutes > 0 ? `${minutes} min` : `${todayStats.totalTime}s`} studied today
          </Text>
        </View>
      )}

      {dueDecks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ready to study</Text>
          {dueDecks.map((deck) => (
            <Pressable
              key={deck.id}
              style={styles.deckRow}
              onPress={() => router.push(`/study/${deck.id}`)}
            >
              <View style={styles.deckInfo}>
                <Text style={styles.deckName}>{deck.name}</Text>
                <Text style={styles.deckCount}>
                  {deck.newCount > 0 ? `${deck.newCount} new · ` : ''}
                  {deck.dueCount} due
                </Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>
      )}

      {dueDecks.length === 0 && decks.length > 0 && (
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneText}>All caught up!</Text>
          <Text style={styles.doneSubtext}>No cards due right now</Text>
        </View>
      )}

      {decks.length === 0 && (
        <View style={styles.doneCard}>
          <Text style={styles.doneEmoji}>📚</Text>
          <Text style={styles.doneText}>Welcome to Reki</Text>
          <Text style={styles.doneSubtext}>Go to Decks tab to create your first deck</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D3436',
  },
  date: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  statLabel: {
    fontSize: 11,
    color: '#636E72',
    marginTop: 4,
  },
  timeCard: {
    backgroundColor: '#F0EDFF',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  timeText: {
    fontSize: 14,
    color: '#6C5CE7',
    fontWeight: '500',
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
  },
  deckRow: {
    backgroundColor: '#FFFFFF',
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
  deckInfo: {
    flex: 1,
  },
  deckName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3436',
  },
  deckCount: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 2,
  },
  arrow: {
    fontSize: 24,
    color: '#B2BEC3',
    marginLeft: 8,
  },
  doneCard: {
    alignItems: 'center',
    marginTop: 40,
    padding: 24,
  },
  doneEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  doneText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
  },
  doneSubtext: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 6,
  },
});
