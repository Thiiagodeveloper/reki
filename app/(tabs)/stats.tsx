import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { studySessionsDao } from '@/src/lib/database';
import type { DailyStats } from '@/src/lib/database/study-sessions.dao';

export default function StatsScreen() {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [allTime, setAllTime] = useState({
    totalCards: 0,
    totalCorrect: 0,
    totalTime: 0,
    totalSessions: 0,
    avgAccuracy: 0,
  });
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [daily, allTimeData, currentStreak] = await Promise.all([
      studySessionsDao.getLast30DaysStats(),
      studySessionsDao.getAllTimeStats(),
      studySessionsDao.getStreak(),
    ]);
    setDailyStats(daily);
    setAllTime(allTimeData);
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

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hours}h ${remainMins}m`;
  };

  const maxStudied = Math.max(...dailyStats.map((d) => d.cardsStudied), 1);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.sectionTitle}>All Time</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{allTime.totalCards}</Text>
          <Text style={styles.statLabel}>Cards Reviewed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#00B894' }]}>{allTime.avgAccuracy}%</Text>
          <Text style={styles.statLabel}>Avg Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#E17055' }]}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatTime(allTime.totalTime)}</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Last 30 Days</Text>
      {dailyStats.length === 0 ? (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>No study data yet</Text>
          <Text style={styles.emptySubtext}>Start studying to see your progress here</Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <View style={styles.chart}>
            {dailyStats.map((day) => {
              const height = Math.max((day.cardsStudied / maxStudied) * 120, 4);
              const accuracy =
                day.cardsStudied > 0 ? Math.round((day.cardsCorrect / day.cardsStudied) * 100) : 0;
              const barColor = accuracy >= 80 ? '#6C5CE7' : accuracy >= 50 ? '#A29BFE' : '#DFE6E9';

              return (
                <View key={day.date} style={styles.barWrapper}>
                  <View style={[styles.bar, { height, backgroundColor: barColor }]} />
                  <Text style={styles.barLabel}>{new Date(day.date + 'T00:00:00').getDate()}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#6C5CE7' }]} />
              <Text style={styles.legendText}>80%+ accuracy</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#A29BFE' }]} />
              <Text style={styles.legendText}>50-79%</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#DFE6E9' }]} />
              <Text style={styles.legendText}>Below 50%</Text>
            </View>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Sessions</Text>
      <View style={styles.sessionsSummary}>
        <Text style={styles.sessionsText}>{allTime.totalSessions} total sessions</Text>
      </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 12,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    flexGrow: 1,
    flexBasis: '45%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6C5CE7',
  },
  statLabel: {
    fontSize: 12,
    color: '#636E72',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 140,
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    borderRadius: 3,
    minWidth: 4,
  },
  barLabel: {
    fontSize: 8,
    color: '#B2BEC3',
    marginTop: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#636E72',
  },
  emptyChart: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3436',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 6,
  },
  sessionsSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionsText: {
    fontSize: 14,
    color: '#636E72',
  },
});
