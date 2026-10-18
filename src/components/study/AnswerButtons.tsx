import { StyleSheet, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Rating, type Grade } from 'ts-fsrs';
import { formatInterval } from '../../lib/fsrs';

interface AnswerButtonsProps {
  intervalPreview: Record<number, { due: Date; interval: number }> | null;
  onGrade: (grade: Grade) => void;
}

const buttons: { grade: Grade; label: string; color: string; bgColor: string }[] = [
  { grade: Rating.Again, label: 'Again', color: '#FF7675', bgColor: '#FFF0F0' },
  { grade: Rating.Hard, label: 'Hard', color: '#E17055', bgColor: '#FFF3ED' },
  { grade: Rating.Good, label: 'Good', color: '#00B894', bgColor: '#E8FFF7' },
  { grade: Rating.Easy, label: 'Easy', color: '#6C5CE7', bgColor: '#F0EDFF' },
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
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  interval: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
});
