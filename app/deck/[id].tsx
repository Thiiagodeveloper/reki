import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';

import { cardsDao, decksDao } from '@/src/lib/database';
import { exportDeckAsApkg } from '@/src/lib/apkg';
import type { Card, Deck } from '@/src/types';

export default function DeckDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [deckData, cardsData] = await Promise.all([
      decksDao.getDeckById(deckId),
      cardsDao.getCardsByDeck(deckId),
    ]);
    setDeck(deckData);
    setCards(cardsData);
    setLoading(false);
  }, [deckId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = useCallback(() => {
    setEditingCard(null);
    setFront('');
    setBack('');
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((card: Card) => {
    setEditingCard(card);
    setFront(card.front);
    setBack(card.back);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!front.trim() || !back.trim()) return;
    if (editingCard) {
      await cardsDao.updateCard(editingCard.id, front.trim(), back.trim());
    } else {
      await cardsDao.createCard(deckId, front.trim(), back.trim());
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setModalVisible(false);
    loadData();
  }, [front, back, editingCard, deckId, loadData]);

  const handleDeleteCard = useCallback(
    (card: Card) => {
      Alert.alert('Delete Card', 'Are you sure you want to delete this card?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cardsDao.deleteCard(card.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            loadData();
          },
        },
      ]);
    },
    [loadData],
  );

  const renderCard = useCallback(
    ({ item }: { item: Card }) => (
      <Pressable style={styles.cardItem} onPress={() => openEditModal(item)}>
        <View style={styles.cardContent}>
          <Text style={styles.cardFront} numberOfLines={2}>
            {item.front}
          </Text>
          <Text style={styles.cardBack} numberOfLines={2}>
            {item.back}
          </Text>
        </View>
        <Pressable onPress={() => handleDeleteCard(item)} hitSlop={10}>
          <Text style={styles.deleteBtn}>✕</Text>
        </Pressable>
      </Pressable>
    ),
    [openEditModal, handleDeleteCard],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: deck?.name ?? 'Deck',
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {cards.length > 0 && (
                <Pressable
                  onPress={async () => {
                    try {
                      const uri = await exportDeckAsApkg(deckId, deck?.name ?? 'deck');
                      await Sharing.shareAsync(uri, { mimeType: 'application/apkg' });
                    } catch (e) {
                      Alert.alert('Export Error', (e as Error).message);
                    }
                  }}
                  style={styles.exportHeaderBtn}
                >
                  <Text style={styles.exportHeaderBtnText}>Export</Text>
                </Pressable>
              )}
              {cards.length > 0 && (
                <Pressable
                  onPress={() => router.push(`/study/${deckId}`)}
                  style={styles.studyHeaderBtn}
                >
                  <Text style={styles.studyHeaderBtnText}>Study</Text>
                </Pressable>
              )}
            </View>
          ),
        }}
      />

      <FlatList
        data={cards}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadData}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No cards yet</Text>
            <Text style={styles.emptySubtitle}>Tap + to add your first card</Text>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={openCreateModal}>
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCard ? 'Edit Card' : 'New Card'}</Text>

            <Text style={styles.label}>Front</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Question or term"
              value={front}
              onChangeText={setFront}
              multiline
              autoFocus
            />

            <Text style={styles.label}>Back</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Answer or definition"
              value={back}
              onChangeText={setBack}
              multiline
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, (!front.trim() || !back.trim()) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!front.trim() || !back.trim()}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flex: 1,
  },
  cardFront: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3436',
  },
  cardBack: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 4,
  },
  deleteBtn: {
    fontSize: 16,
    color: '#B2BEC3',
    padding: 4,
    marginLeft: 12,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C5CE7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    marginTop: -2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#636E72',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F1F2F6',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    color: '#2D3436',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  cancelBtnText: {
    fontSize: 16,
    color: '#636E72',
  },
  saveBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  studyHeaderBtn: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  studyHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  exportHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6C5CE7',
  },
  exportHeaderBtnText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '600',
  },
});
