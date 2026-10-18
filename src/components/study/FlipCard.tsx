import { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { CardBack } from './CardBack';

interface FlipCardProps {
  front: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeakFront?: () => void;
  onSpeakBack?: () => void;
}

export function FlipCard({
  front,
  back,
  isFlipped,
  onFlip,
  onSpeakFront,
  onSpeakBack,
}: FlipCardProps) {
  const rotation = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 1], [0, 180])}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 1], [180, 360])}deg` }],
    backfaceVisibility: 'hidden' as const,
  }));

  useEffect(() => {
    rotation.value = withTiming(isFlipped ? 1 : 0, { duration: 400 });
  }, [isFlipped, rotation]);

  return (
    <View style={styles.container}>
      <View style={styles.cardWrapper}>
        {/* Back card */}
        <Animated.View
          style={[styles.card, styles.backCard, backStyle]}
          pointerEvents={isFlipped ? 'auto' : 'none'}
        >
          <ScrollView
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <CardBack content={back} front={front} onSpeak={onSpeakBack} />
          </ScrollView>
        </Animated.View>

        {/* Front card */}
        <Animated.View
          style={[styles.card, styles.frontCard, frontStyle]}
          pointerEvents={isFlipped ? 'none' : 'auto'}
        >
          <Pressable style={styles.cardPressable} onPress={onFlip}>
            <View style={styles.frontContent}>
              <Text style={styles.frontText}>{front}</Text>
              <Text style={styles.tapHint}>Tap to reveal</Text>
            </View>
          </Pressable>
          {onSpeakFront && (
            <Pressable
              style={styles.speakBtn}
              onPress={(e) => {
                e.stopPropagation();
                onSpeakFront();
              }}
            >
              <Text style={styles.speakIcon}>🔈</Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </View>
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
    overflow: 'hidden',
  },
  cardPressable: {
    flex: 1,
  },
  frontCard: {
    backgroundColor: '#FFFFFF',
  },
  backCard: {
    backgroundColor: '#F0EDFF',
  },
  frontContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 70,
  },
  cardContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  frontText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2D3436',
    textAlign: 'center',
    lineHeight: 38,
  },
  tapHint: {
    fontSize: 13,
    color: '#B2BEC3',
    marginTop: 24,
  },
  speakBtn: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  speakBtnActive: {
    backgroundColor: '#6C5CE7',
  },
  speakIcon: {
    fontSize: 22,
  },
});
