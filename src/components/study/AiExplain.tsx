import { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { explainCard, getApiKey } from '../../lib/ai';

interface AiExplainProps {
  front: string;
  back: string;
}

export function AiExplain({ front, back }: AiExplainProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  const handleExplain = async () => {
    if (hasKey === null) {
      const key = await getApiKey();
      setHasKey(!!key);
      if (!key) return;
    }
    if (hasKey === false) return;

    setLoading(true);
    try {
      const text = await explainCard(front, back);
      setExplanation(text);
    } catch {
      setExplanation('Could not generate explanation. Check your API key in Settings.');
    } finally {
      setLoading(false);
    }
  };

  if (!explanation && !loading) {
    return (
      <Pressable style={styles.triggerBtn} onPress={handleExplain}>
        <Text style={styles.triggerText}>Need help? Ask AI</Text>
      </Pressable>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#6C5CE7" />
        <Text style={styles.loadingText}>Thinking...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Explanation</Text>
      <Text style={styles.explanation}>{explanation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  triggerBtn: {
    backgroundColor: '#F0EDFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 8,
  },
  triggerText: {
    color: '#6C5CE7',
    fontSize: 13,
    fontWeight: '600',
  },
  container: {
    backgroundColor: '#F0EDFF',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  loadingText: {
    color: '#6C5CE7',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  title: {
    color: '#6C5CE7',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  explanation: {
    color: '#2D3436',
    fontSize: 14,
    lineHeight: 21,
  },
});
