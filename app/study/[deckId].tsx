import { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import type { Grade } from 'ts-fsrs';

import { useStudyStore } from '@/src/stores/study.store';
import { useSpeech } from '@/src/hooks/useSpeech';
import { FlipCard } from '@/src/components/study/FlipCard';
import { AnswerButtons } from '@/src/components/study/AnswerButtons';

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const id = Number(deckId);
  const { speak } = useSpeech();

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

  if (isComplete()) {
    const accuracy = cardsStudied > 0 ? Math.round((cardsCorrect / cardsStudied) * 100) : 0;
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Complete!' }} />
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyTitle}>Session Complete!</Text>

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
});
