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

const buttons: { grade: Grade; label: string; activeColor: string; activeBg: string }[] = [
  { grade: Rating.Again, label: 'Again', activeColor: '#D63031', activeBg: '#FFCCCC' },
  { grade: Rating.Hard, label: 'Hard', activeColor: '#E17055', activeBg: '#FFD8CC' },
  { grade: Rating.Good, label: 'Good', activeColor: '#00856A', activeBg: '#B8F0DD' },
  { grade: Rating.Easy, label: 'Easy', activeColor: '#5A4BD1', activeBg: '#D5CFFF' },
];

function AnswerButtonsInner({ intervalPreview, onGrade, visible }: AnswerButtonsProps) {
  const handlePress = (grade: Grade) => {
    if (!visible) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGrade(grade);
  };

  return (
    <View style={styles.container}>
      {buttons.map(({ grade, label, activeColor, activeBg }) => {
        const color = visible ? activeColor : '#B2BEC3';
        const bg = visible ? activeBg : '#F1F2F6';
        const borderColor = visible ? activeColor : '#DFE6E9';

        return (
          <Pressable
            key={grade}
            style={[styles.button, { backgroundColor: bg, borderColor, borderWidth: 1.5 }]}
            onPress={() => handlePress(grade)}
          >
            <Text style={[styles.label, { color }]}>{label}</Text>
            <Text style={[styles.interval, { color }]}>
              {visible && intervalPreview?.[grade]
                ? formatInterval(intervalPreview[grade].interval)
                : ' '}
            </Text>
          </Pressable>
        );
      })}
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
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  interval: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.85,
  },
});
