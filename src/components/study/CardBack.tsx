import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { Paths } from 'expo-file-system';

interface CardBackProps {
  content: string;
  onSpeak?: () => void;
}

interface ParsedBack {
  definitions: string[];
  irregularForms: string[];
  exampleSentence: string | null;
  translation: string | null;
  imageName: string | null;
  other: string[];
}

function parseBackContent(content: string): ParsedBack {
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
  const result: ParsedBack = {
    definitions: [],
    irregularForms: [],
    exampleSentence: null,
    translation: null,
    imageName: null,
    other: [],
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const imgMatch = trimmed.match(/^\[img:(.+)\]$/);
    if (imgMatch) {
      result.imageName = imgMatch[1];
      continue;
    }
    if (
      trimmed.startsWith('(v.)') ||
      trimmed.startsWith('(noun.)') ||
      trimmed.startsWith('(adj.)') ||
      trimmed.startsWith('(adv.)')
    ) {
      result.definitions.push(trimmed);
    } else if (trimmed.length < 20 && !trimmed.includes(' ') && /^[a-z]/.test(trimmed)) {
      result.irregularForms.push(trimmed);
    } else if (
      /^[A-Z]/.test(trimmed) &&
      trimmed.length > 10 &&
      trimmed.includes(' ') &&
      !result.exampleSentence
    ) {
      result.exampleSentence = trimmed;
    } else if (/^[¿¡]|^[A-ZÁÉÍÓÚ]/.test(trimmed) && result.exampleSentence && !result.translation) {
      result.translation = trimmed;
    } else if (trimmed.length > 2) {
      result.other.push(trimmed);
    }
  }

  if (result.definitions.length === 0 && result.other.length > 0) {
    result.definitions = result.other;
    result.other = [];
  }

  return result;
}

export function CardBack({ content, onSpeak }: CardBackProps) {
  const parsed = parseBackContent(content);
  const hasStructure = parsed.definitions.length > 0 || parsed.exampleSentence;

  if (!hasStructure) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.label}>Answer</Text>
          {onSpeak && (
            <Pressable style={styles.speakBtn} onPress={onSpeak}>
              <Text style={styles.speakIcon}>🔈</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.plainText}>{content}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Answer</Text>
        {onSpeak && (
          <Pressable style={styles.speakBtn} onPress={onSpeak}>
            <Text style={styles.speakIcon}>🔈</Text>
          </Pressable>
        )}
      </View>

      {parsed.definitions.length > 0 && (
        <View style={styles.section}>
          {parsed.definitions.map((def, i) => (
            <Text key={i} style={styles.definition}>
              {def}
            </Text>
          ))}
        </View>
      )}

      {parsed.irregularForms.length > 0 && (
        <View style={styles.formsRow}>
          {parsed.irregularForms.map((form, i) => (
            <View key={i} style={styles.formBadge}>
              <Text style={styles.formText}>{form}</Text>
            </View>
          ))}
        </View>
      )}

      {parsed.exampleSentence && (
        <View style={styles.exampleBox}>
          <Text style={styles.exampleText}>"{parsed.exampleSentence}"</Text>
        </View>
      )}

      {parsed.translation && <Text style={styles.translationText}>{parsed.translation}</Text>}

      {parsed.imageName && (
        <Image
          source={{ uri: `${Paths.document.uri}reki_media/${parsed.imageName}` }}
          style={styles.cardImage}
          resizeMode="contain"
        />
      )}

      {parsed.other.length > 0 && (
        <View style={styles.section}>
          {parsed.other.map((line, i) => (
            <Text key={i} style={styles.otherText}>
              {line}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6C5CE7',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  speakBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8E4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakIcon: {
    fontSize: 14,
  },
  plainText: {
    fontSize: 20,
    color: '#2D3436',
    textAlign: 'center',
    lineHeight: 30,
  },
  section: {
    marginBottom: 12,
    alignItems: 'center',
  },
  definition: {
    fontSize: 16,
    color: '#2D3436',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 2,
  },
  formsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  formBadge: {
    backgroundColor: '#E8E4FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  formText: {
    fontSize: 13,
    color: '#6C5CE7',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  exampleBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    width: '100%',
    borderLeftWidth: 3,
    borderLeftColor: '#6C5CE7',
  },
  exampleText: {
    fontSize: 15,
    color: '#2D3436',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  translationText: {
    fontSize: 13,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 8,
  },
  otherText: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginVertical: 10,
  },
});
