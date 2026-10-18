import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Rating, type Grade } from 'ts-fsrs';
import { formatInterval } from '../../lib/fsrs';

interface AnswerButtonsProps {
  intervalPreview: Record<number, { due: Date; interval: number }> | null;
  onGrade: (grade: Grade) => void;
}

const buttons: { grade: Grade; label: string; color: string; bgColor: string }[] = [
  { grade: Rating.Again, label: 'Again', color: '#FFFFFF', bgColor: '#FF7675' },
  { grade: Rating.Hard, label: 'Hard', color: '#FFFFFF', bgColor: '#E17055' },
  { grade: Rating.Good, label: 'Good', color: '#FFFFFF', bgColor: '#00B894' },
  { grade: Rating.Easy, label: 'Easy', color: '#FFFFFF', bgColor: '#6C5CE7' },
];

export function AnswerButtons({ intervalPreview, onGrade }: AnswerButtonsProps) {
  const handlePress = (grade: Grade) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onGrade(grade);
  };

  return (
    <View style={styles.container}>
      {buttons.map(({ grade, label, color, bgColor }) => (
        <Pressable
          key={grade}
          style={[styles.button, { backgroundColor: bgColor }]}
          onPress={() => handlePress(grade)}
        >
          <Text style={[styles.label, { color }]}>{label}</Text>
          <Text style={[styles.interval, { color }]}>
            {intervalPreview?.[grade] ? formatInterval(intervalPreview[grade].interval) : ''}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

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
    fontWeight: '600',
  },
  interval: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.85,
  },
});
