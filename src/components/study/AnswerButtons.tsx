import React from 'react';
import { StyleSheet, Text, Pressable, Dimensions } from 'react-native';
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

const SCREEN_WIDTH = Dimensions.get('window').width;
const PADDING = 12;
const GAP = 6;
const BUTTON_WIDTH = (SCREEN_WIDTH - PADDING * 2 - GAP * 3) / 4;

function AnswerButtonsInner({ intervalPreview, onGrade, visible }: AnswerButtonsProps) {
  return (
    <Pressable style={styles.container} disabled>
      {buttons.map(({ grade, label, color, bgColor }) => (
        <Pressable
          key={grade}
          style={[
            styles.button,
            {
              backgroundColor: visible ? bgColor : '#EEEEEE',
              width: BUTTON_WIDTH,
            },
          ]}
          onPress={() => {
            if (!visible) return;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onGrade(grade);
          }}
        >
          <Text style={[styles.label, { color: visible ? color : '#CCCCCC' }]}>{label}</Text>
          <Text style={[styles.interval, { color: visible ? color : '#CCCCCC' }]}>
            {visible && intervalPreview?.[grade]
              ? formatInterval(intervalPreview[grade].interval)
              : ' '}
          </Text>
        </Pressable>
      ))}
    </Pressable>
  );
}

export const AnswerButtons = React.memo(AnswerButtonsInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: PADDING,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  button: {
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
