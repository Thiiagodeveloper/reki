import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, Pressable } from 'react-native';
import { Stack, router } from 'expo-router';

import { cardsDao } from '@/src/lib/database';
import { useThemeColors } from '@/src/hooks/useThemeColors';
import type { Card } from '@/src/types';

type SearchResult = Card & { deckName: string };

export default function SearchScreen() {
  const c = useThemeColors();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    const found = await cardsDao.searchCards(text.trim());
    setResults(found);
    setSearched(true);
  }, []);

  const renderResult = useCallback(
    ({ item }: { item: SearchResult }) => (
      <Pressable
        style={[styles.resultCard, { backgroundColor: c.surface }]}
        onPress={() => router.push(`/deck/${item.deckId}`)}
      >
        <Text style={[styles.front, { color: c.text }]} numberOfLines={2}>
          {item.front}
        </Text>
        <Text style={[styles.back, { color: c.textSecondary }]} numberOfLines={2}>
          {item.back}
        </Text>
        <View style={styles.meta}>
          <Text style={[styles.deckBadge, { backgroundColor: c.primary + '20', color: c.primary }]}>
            {item.deckName}
          </Text>
          {item.tags ? (
            <Text style={[styles.tags, { color: c.textSecondary }]}>{item.tags}</Text>
          ) : null}
        </View>
      </Pressable>
    ),
    [c],
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: 'Search Cards' }} />

      <View style={styles.searchBar}>
        <TextInput
          style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
          placeholder="Search cards..."
          placeholderTextColor={c.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoFocus
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderResult}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          searched ? (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                No cards found for "{query}"
              </Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                Type at least 2 characters to search
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { padding: 16, paddingBottom: 8 },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  list: { padding: 16, paddingTop: 8 },
  resultCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  front: { fontSize: 16, fontWeight: '500' },
  back: { fontSize: 14, marginTop: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  deckBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '500',
  },
  tags: { fontSize: 11 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14 },
});
