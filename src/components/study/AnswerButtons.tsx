import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Rating, type Grade } from 'ts-fsrs';
import { formatInterval } from '../../lib/fsrs';

interface AnswerButtonsProps {
  intervalPreview: Record<number, { due: Date; interval: number }> | null;
  onGrade: (grade: Grade) => void;
  visible: boolean;
}

const buttons: { grade: Grade; label: string; color: string; bgColor: string }[] = [
  { grade: Rating.Again, label: 'Again', color: '#D63031', bgColor: '#FFCCCC' },
  { grade: Rating.Hard, label: 'Hard', color: '#E17055', bgColor: '#FFD8CC' },
  { grade: Rating.Good, label: 'Good', color: '#00856A', bgColor: '#B8F0DD' },
  { grade: Rating.Easy, label: 'Easy', color: '#5A4BD1', bgColor: '#D5CFFF' },
];

function AnswerButtonsInner({ intervalPreview, onGrade, visible }: AnswerButtonsProps) {
  return (
    <View
      style={[styles.container, { opacity: visible ? 1 : 0 }]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      {buttons.map(({ grade, label, color, bgColor }) => (
        <Pressable
          key={grade}
          style={[styles.button, { backgroundColor: bgColor }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onGrade(grade);
          }}
        >
          <Text style={[styles.label, { color }]}>{label}</Text>
          <Text style={[styles.interval, { color }]}>
            {intervalPreview?.[grade] ? formatInterval(intervalPreview[grade].interval) : ' '}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export const AnswerButtons = React.memo(AnswerButtonsInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 6,
    height: 56,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  interval: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
});
