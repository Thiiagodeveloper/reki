import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import type { Grade } from 'ts-fsrs';

import { useStudyStore } from '@/src/stores/study.store';
import { useSpeech } from '@/src/hooks/useSpeech';
import { addXp, getXpForNextLevel, type Achievement } from '@/src/lib/gamification';
import { FlipCard } from '@/src/components/study/FlipCard';
import { AnswerButtons } from '@/src/components/study/AnswerButtons';

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const id = Number(deckId);
  const { speak } = useSpeech();
  const [xpGained, setXpGained] = useState(0);
  const [levelInfo, setLevelInfo] = useState({ current: 0, needed: 100, progress: 0 });
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [xpLevel, setXpLevel] = useState(1);

  const {
    queue,
    loading,
    isFlipped,
    cardsStudied,
    cardsCorrect,
    intervalPreview,
    startSession,
    flipCard,
    answerCard,
    currentCard,
    remainingCount,
    isComplete,
  } = useStudyStore();

  useEffect(() => {
    startSession(id);
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Study' }} />
        <ActivityIndicator size="large" color="#6C5CE7" />
      </View>
    );
  }

  if (queue.length === 0) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Study' }} />
        <Text style={styles.emptyIcon}>🎉</Text>
        <Text style={styles.emptyTitle}>No cards to study</Text>
        <Text style={styles.emptySubtitle}>Add some cards to this deck first</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  useEffect(() => {
    if (isComplete() && cardsStudied > 0) {
      addXp(cardsStudied, cardsCorrect).then(
        ({ xpGained: xp, newAchievements: achievements, data }) => {
          setXpGained(xp);
          setNewAchievements(achievements);
          setXpLevel(data.level);
          setLevelInfo(getXpForNextLevel(data));
        },
      );
    }
  }, [isComplete(), cardsStudied, cardsCorrect]);

  if (isComplete()) {
    const accuracy = cardsStudied > 0 ? Math.round((cardsCorrect / cardsStudied) * 100) : 0;
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Complete!' }} />
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyTitle}>Session Complete!</Text>

        {xpGained > 0 && (
          <View style={styles.xpBox}>
            <Text style={styles.xpText}>+{xpGained} XP</Text>
            <Text style={styles.levelText}>Level {xpLevel}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpBarFill, { width: `${levelInfo.progress * 100}%` }]} />
            </View>
            <Text style={styles.xpProgress}>
              {levelInfo.current}/{levelInfo.needed} XP
            </Text>
          </View>
        )}

        {newAchievements.length > 0 && (
          <View style={styles.achievementsBox}>
            {newAchievements.map((a) => (
              <View key={a.id} style={styles.achievementRow}>
                <Text style={styles.achievementIcon}>{a.icon}</Text>
                <View>
                  <Text style={styles.achievementTitle}>{a.title}</Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{cardsStudied}</Text>
            <Text style={styles.statLabel}>Studied</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{cardsCorrect}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
        </View>

        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  const card = currentCard();
  if (!card) return null;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `${remainingCount()} remaining` }} />

      <View style={styles.progress}>
        <View style={[styles.progressBar, { width: `${(cardsStudied / queue.length) * 100}%` }]} />
      </View>

      <FlipCard
        front={card.card.front}
        back={card.card.back}
        isFlipped={isFlipped}
        onFlip={flipCard}
        onSpeakFront={() => speak(card.card.front)}
        onSpeakBack={() => {
          const lines = card.card.back.split('\n').filter((l) => l.trim().length > 5);
          const englishSentence = lines.find(
            (l) => /^[A-Z]/.test(l.trim()) && l.includes(' ') && l.length > 10,
          );
          speak(englishSentence || card.card.front);
        }}
      />

      <AnswerButtons
        intervalPreview={intervalPreview}
        onGrade={(grade: Grade) => answerCard(grade)}
        visible={isFlipped}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
  },
  progress: {
    height: 3,
    backgroundColor: '#E0E0E0',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#6C5CE7',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D3436',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 16,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
  backBtn: {
    marginTop: 32,
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  xpBox: {
    backgroundColor: '#F0EDFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    width: '80%',
  },
  xpText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6C5CE7',
  },
  levelText: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  xpBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#DFE6E9',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 8,
    backgroundColor: '#6C5CE7',
    borderRadius: 4,
  },
  xpProgress: {
    fontSize: 11,
    color: '#636E72',
    marginTop: 4,
  },
  achievementsBox: {
    marginTop: 16,
    width: '80%',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  achievementIcon: {
    fontSize: 24,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  achievementDesc: {
    fontSize: 12,
    color: '#636E72',
  },
});
