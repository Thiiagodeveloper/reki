import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

interface FlipCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export function FlipCard({ front, back, isFlipped, onFlip }: FlipCardProps) {
  const rotation = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  if (isFlipped && rotation.value === 0) {
    rotation.value = withTiming(1, { duration: 400 });
  } else if (!isFlipped && rotation.value === 1) {
    rotation.value = withTiming(0, { duration: 400 });
  }

  return (
    <Pressable style={styles.container} onPress={!isFlipped ? onFlip : undefined}>
      <View style={styles.cardWrapper}>
        <Animated.View style={[styles.card, styles.frontCard, frontStyle]}>
          <ScrollView
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.cardText}>{front}</Text>
            {!isFlipped && <Text style={styles.tapHint}>Tap to reveal</Text>}
          </ScrollView>
        </Animated.View>

        <Animated.View style={[styles.card, styles.backCard, backStyle]}>
          <ScrollView
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.label}>Answer</Text>
            <Text style={styles.cardText}>{back}</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  cardWrapper: {
    flex: 1,
    position: 'relative',
  },
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  frontCard: {
    backgroundColor: '#FFFFFF',
  },
  backCard: {
    backgroundColor: '#F0EDFF',
  },
  cardContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C5CE7',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  cardText: {
    fontSize: 22,
    color: '#2D3436',
    textAlign: 'center',
    lineHeight: 32,
  },
  tapHint: {
    fontSize: 13,
    color: '#B2BEC3',
    marginTop: 24,
  },
});
