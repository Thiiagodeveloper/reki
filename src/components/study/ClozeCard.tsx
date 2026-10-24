import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable } from 'react-native';

interface ClozeCardProps {
  text: string;
  answer: string;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeakFront?: () => void;
}

export function ClozeCard({ text, answer, isFlipped, onFlip, onSpeakFront }: ClozeCardProps) {
  const [userAnswer, setUserAnswer] = useState('');

  const isCorrect = userAnswer.trim().toLowerCase() === answer.trim().toLowerCase();
  const hasAnswered = userAnswer.trim().length > 0;

  const displayText = text.replace(
    /\{\{c\d+::([^}]+?)(?:::.*?)?\}\}/g,
    isFlipped ? `[$1]` : '[___]',
  );

  return (
    <View style={styles.container}>
      <View style={[styles.card, isFlipped && styles.cardFlipped]}>
        <Text style={styles.clozeText}>{displayText}</Text>

        {!isFlipped && (
          <View style={styles.inputArea}>
            <TextInput
              style={[
                styles.input,
                hasAnswered && (isCorrect ? styles.inputCorrect : styles.inputWrong),
              ]}
              placeholder="Type your answer..."
              placeholderTextColor="#B2BEC3"
              value={userAnswer}
              onChangeText={setUserAnswer}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable style={styles.checkBtn} onPress={onFlip}>
              <Text style={styles.checkBtnText}>{userAnswer.trim() ? 'Check' : 'Show Answer'}</Text>
            </Pressable>
          </View>
        )}

        {isFlipped && (
          <View style={styles.resultArea}>
            <Text style={styles.answerLabel}>Answer</Text>
            <Text style={styles.answerText}>{answer}</Text>
            {hasAnswered && (
              <View
                style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.wrongBadge]}
              >
                <Text style={styles.resultText}>{isCorrect ? 'Correct!' : 'Incorrect'}</Text>
              </View>
            )}
            {hasAnswered && !isCorrect && (
              <Text style={styles.yourAnswer}>Your answer: {userAnswer}</Text>
            )}
          </View>
        )}

        {onSpeakFront && (
          <Pressable style={styles.speakBtn} onPress={onSpeakFront}>
            <Text style={styles.speakIcon}>🔈</Text>
          </Pressable>
        )}
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
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardFlipped: {
    backgroundColor: '#F0EDFF',
  },
  clozeText: {
    fontSize: 20,
    color: '#2D3436',
    textAlign: 'center',
    lineHeight: 30,
  },
  inputArea: {
    width: '100%',
    marginTop: 24,
  },
  input: {
    backgroundColor: '#F1F2F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    textAlign: 'center',
    color: '#2D3436',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputCorrect: {
    borderColor: '#00B894',
    backgroundColor: '#E8FFF7',
  },
  inputWrong: {
    borderColor: '#FF7675',
    backgroundColor: '#FFF0F0',
  },
  checkBtn: {
    backgroundColor: '#6C5CE7',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultArea: {
    alignItems: 'center',
    marginTop: 20,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C5CE7',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  answerText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#2D3436',
    marginTop: 8,
  },
  resultBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  correctBadge: {
    backgroundColor: '#E8FFF7',
  },
  wrongBadge: {
    backgroundColor: '#FFF0F0',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3436',
  },
  yourAnswer: {
    fontSize: 13,
    color: '#636E72',
    marginTop: 8,
  },
  speakBtn: {
    position: 'absolute',
    bottom: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakIcon: {
    fontSize: 18,
  },
});
