import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';

import { getXpData, getXpForNextLevel, ACHIEVEMENTS, type XpData } from '@/src/lib/gamification';
import { useThemeColors } from '@/src/hooks/useThemeColors';

export default function AchievementsScreen() {
  const c = useThemeColors();
  const [xpData, setXpData] = useState<XpData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const data = await getXpData();
    setXpData(data);
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

  if (!xpData) return null;

  const levelInfo = getXpForNextLevel(xpData);
  const unlockedCount = xpData.achievements.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Stack.Screen options={{ title: 'Achievements' }} />

      <View style={[styles.profileCard, { backgroundColor: c.surface }]}>
        <Text style={[styles.level, { color: c.primary }]}>Level {xpData.level}</Text>
        <Text style={[styles.totalXp, { color: c.text }]}>{xpData.totalXp} XP</Text>
        <View style={[styles.xpBar, { backgroundColor: c.border }]}>
          <View
            style={[
              styles.xpBarFill,
              { backgroundColor: c.primary, width: `${levelInfo.progress * 100}%` },
            ]}
          />
        </View>
        <Text style={[styles.xpProgress, { color: c.textSecondary }]}>
          {levelInfo.current}/{levelInfo.needed} XP to next level
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.danger }]}>{xpData.streak}</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>Streak</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.success }]}>{xpData.todayXp}</Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>Today XP</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: c.primary }]}>
              {unlockedCount}/{ACHIEVEMENTS.length}
            </Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>Unlocked</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: c.text }]}>Achievements</Text>

      {ACHIEVEMENTS.map((achievement) => {
        const unlocked = xpData.achievements.includes(achievement.id);
        return (
          <View
            key={achievement.id}
            style={[
              styles.achievementCard,
              { backgroundColor: unlocked ? c.surface : c.background },
              !unlocked && styles.lockedCard,
            ]}
          >
            <Text style={[styles.achievementIcon, !unlocked && styles.lockedIcon]}>
              {unlocked ? achievement.icon : '🔒'}
            </Text>
            <View style={styles.achievementInfo}>
              <Text
                style={[styles.achievementTitle, { color: unlocked ? c.text : c.textSecondary }]}
              >
                {achievement.title}
              </Text>
              <Text style={[styles.achievementDesc, { color: c.textSecondary }]}>
                {achievement.description}
              </Text>
            </View>
            {unlocked && <Text style={styles.checkmark}>✓</Text>}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  level: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  totalXp: { fontSize: 36, fontWeight: '800', marginTop: 4 },
  xpBar: { width: '100%', height: 8, borderRadius: 4, marginTop: 16, overflow: 'hidden' },
  xpBarFill: { height: 8, borderRadius: 4 },
  xpProgress: { fontSize: 12, marginTop: 6 },
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  lockedCard: { opacity: 0.5 },
  achievementIcon: { fontSize: 28, marginRight: 14 },
  lockedIcon: { opacity: 0.4 },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: 15, fontWeight: '600' },
  achievementDesc: { fontSize: 12, marginTop: 2 },
  checkmark: { fontSize: 18, color: '#00B894', fontWeight: '700' },
});
